const express = require('express'); //framework pentru servere web
const router = express.Router(); //sistemul care gestionează adresele (rutele)
const Observation = require('../models/Observation'); 
const Project = require('../models/Project');
const jwt = require('jsonwebtoken'); //autentificare
require('dotenv').config(); //fisierele secrete din .env

// Middleware pentru verificarea tokenului JWT
const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'Nu exista token, autorizare refuzata' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tokenSecret');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalid' });
  }
};

// Middleware optional pentru verificarea tokenului (pentru proiecte publice)
const optionalAuthMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tokenSecret');
      req.user = decoded.user;
    } catch (err) {
      // Token invalid, dar continuam fara autentificare
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

// Functie pentru verificarea permisiunilor
async function checkPermission(userId, projectId, action, observationId = null) {
  try {
    const project = await Project.findById(projectId).populate('members.user');
    
    if (!project) {
      return { hasPermission: false, error: 'Proiectul nu exista' };
    }
    
    // Pentru proiecte publice, toata lumea poate vedea
    if (action === 'view' && project.visibility === 'public') {
      return { hasPermission: true, role: 'viewer' };
    }
    
    // Pentru alte actiuni sau proiecte private, verifica membership
    if (!userId) {
      return { hasPermission: false, error: 'Autentificare necesara' };
    }
    
    // Verifica daca utilizatorul este creatorul
    if (project.creator.toString() === userId) {
      return { hasPermission: true, role: 'creator' };
    }
    
    // Verifica daca utilizatorul este membru
    const member = project.members.find(m => m.user._id.toString() === userId);
    if (!member) {
      // Pentru proiecte publice, permite vizualizarea chiar si non-membrilor
      if (action === 'view' && project.visibility === 'public') {
        return { hasPermission: true, role: 'viewer' };
      }
      return { hasPermission: false, error: 'Nu sunteti membru al acestui proiect' };
    }
    
    const role = member.role;
    
    // Definirea permisiunilor pentru fiecare rol
    const permissions = {
      'co-investigator': ['view', 'add_observations', 'edit_own_observations', 'edit_all_observations', 'delete_own_observations', 'delete_all_observations'],
      'asistent-cercetare': ['view', 'add_observations', 'edit_own_observations', 'delete_own_observations'],
      'research-assistant': ['view', 'add_observations', 'edit_own_observations', 'delete_own_observations'],
      'observer': ['view']
    };
    
    const userPermissions = permissions[role] || [];
    
    // Verifica permisiunea specifica
    if (action === 'edit_observation' || action === 'delete_observation') {
      if (observationId) {
        const observation = await Observation.findById(observationId);
        if (!observation) {
          return { hasPermission: false, error: 'Observatia nu exista' };
        }
        
        // Creator poate edita/sterge orice
        if (project.creator.toString() === userId) {
          return { hasPermission: true, role: 'creator' };
        }
        
        // Co-investigator poate edita/sterge orice observatie
        if (role === 'co-investigator') {
          return { hasPermission: true, role };
        }
        
        // Asistent cercetare poate edita/sterge doar propriile observatii
        if ((role === 'asistent-cercetare' || role === 'research-assistant') && observation.observer.toString() === userId) {
          return { hasPermission: true, role };
        }
        
        // Observer nu poate edita/sterge nimic
        if (role === 'observer') {
          return { hasPermission: false, error: 'Nu aveti permisiunea sa modificati observatiile' };
        }
        
        return { hasPermission: false, error: 'Nu aveti permisiunea sa modificati aceasta observatie' };
      }
    }
    
    return { 
      hasPermission: userPermissions.includes(action), 
      role,
      error: userPermissions.includes(action) ? null : 'Nu aveti permisiunea pentru aceasta actiune'
    };
    
  } catch (error) {
    console.error('Error in checkPermission:', error);
    return { hasPermission: false, error: 'Eroare la verificarea permisiunilor' };
  }
}

// @route   POST /api/observations
// @desc    Creare observatie noua
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      projectId, 
      species, 
      coordinates, 
      observationDate, 
      count, 
      notes, 
      images 
    } = req.body;
    
    // Verifica permisiunile
    const permissionCheck = await checkPermission(req.user.id, projectId, 'add_observations');
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ msg: permissionCheck.error });
    }
    
    // Creare observatie noua
    const newObservation = new Observation({
      project: projectId,
      observer: req.user.id,
      species,
      location: {
        type: 'Point',
        coordinates
      },
      observationDate,
      count,
      notes,
      images
    });
    
    const observation = await newObservation.save();
    
    // Populeaza datele pentru raspuns
    await observation.populate('project', 'title');
    await observation.populate('observer', 'name email');
    
    res.json(observation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   GET /api/observations/:id
// @desc    Obtinere observatie dupa ID
// @access  Public/Private (depinde de vizibilitatea proiectului)
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const observation = await Observation.findById(req.params.id)
      .populate('project', 'title visibility')
      .populate('observer', 'name email');
    
    if (!observation) {
      return res.status(404).json({ msg: 'Observatia nu a fost gasita' });
    }
    
    // Verifica permisiunile de vizualizare
    const permissionCheck = await checkPermission(req.user?.id, observation.project._id, 'view');
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ msg: permissionCheck.error });
    }
    
    res.json(observation);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Observatia nu a fost gasita' });
    }
    
    res.status(500).send('Eroare de server');
  }
});

// @route   PUT /api/observations/:id
// @desc    Actualizare observatie
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { 
      species, 
      coordinates, 
      observationDate, 
      count, 
      notes, 
      images 
    } = req.body;
    
    // Verifica existenta observatie
    let observation = await Observation.findById(req.params.id);
    
    if (!observation) {
      return res.status(404).json({ msg: 'Observatia nu a fost gasita' });
    }
    
    // Verifica permisiunile de editare
    const permissionCheck = await checkPermission(req.user.id, observation.project, 'edit_observation', req.params.id);
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ msg: permissionCheck.error });
    }
    
    // Actualizare campuri
    if (species) observation.species = species;
    if (coordinates) observation.location.coordinates = coordinates;
    if (observationDate) observation.observationDate = observationDate;
    if (count) observation.count = count;
    if (notes !== undefined) observation.notes = notes;
    if (images) observation.images = images;
    
    await observation.save();
    
    // Populeaza datele pentru raspuns
    await observation.populate('project', 'title');
    await observation.populate('observer', 'name email');
    
    res.json(observation);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Observatia nu a fost gasita' });
    }
    
    res.status(500).send('Eroare de server');
  }
});

// @route   DELETE /api/observations/:id
// @desc    stergere observatie
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Verifica existenta observatie
    const observation = await Observation.findById(req.params.id);
    
    if (!observation) {
      return res.status(404).json({ msg: 'Observatia nu a fost gasita' });
    }
    
    // Verifica permisiunile de stergere
    const permissionCheck = await checkPermission(req.user.id, observation.project, 'delete_observation', req.params.id);
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ msg: permissionCheck.error });
    }
    
    await Observation.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Observatie stearsa' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Observatia nu a fost gasita' });
    }
    
    res.status(500).send('Eroare de server');
  }
});

// @route   GET /api/observations/project/:projectId
// @desc    Obtinere observatii pentru un proiect specific
// @access  Public/Private (depinde de vizibilitatea proiectului)
router.get('/project/:projectId', optionalAuthMiddleware, async (req, res) => {
  try {
    // Verifica permisiunile de vizualizare
    const permissionCheck = await checkPermission(req.user?.id, req.params.projectId, 'view');
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ msg: permissionCheck.error });
    }
    
    const observations = await Observation.find({ project: req.params.projectId })
      .populate('observer', 'name email')
      .sort({ observationDate: -1 });
    
    res.json(observations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   GET /api/observations/:id/permissions
// @desc    Obtinere permisiuni pentru o observatie
// @access  Public/Private (depinde de vizibilitatea proiectului)
router.get('/:id/permissions', optionalAuthMiddleware, async (req, res) => {
  try {
    const observation = await Observation.findById(req.params.id);
    
    if (!observation) {
      return res.status(404).json({ msg: 'Observatia nu a fost gasita' });
    }
    
    const project = await Project.findById(observation.project).populate('members.user');
    
    if (!project) {
      return res.status(404).json({ msg: 'Proiectul nu a fost gasit' });
    }
    
    // Pentru utilizatori neautentificati la proiecte publice
    if (!req.user) {
      if (project.visibility === 'public') {
        return res.json({
          userRole: null,
          canEdit: false,
          canDelete: false,
          isOwner: false
        });
      } else {
        return res.status(403).json({ msg: 'Autentificare necesara' });
      }
    }
    
    // Verifica rolul utilizatorului autentificat
    let userRole = null;
    let canEdit = false;
    let canDelete = false;
    
    if (project.creator.toString() === req.user.id) {
      userRole = 'creator';
      canEdit = true;
      canDelete = true;
    } else {
      const member = project.members.find(m => m.user._id.toString() === req.user.id);
      if (member) {
        userRole = member.role;
        
        const isOwner = observation.observer.toString() === req.user.id;
        
        switch (member.role) {
          case 'co-investigator':
            canEdit = true;
            canDelete = true;
            break;
          case 'asistent-cercetare':
          case 'research-assistant':
            canEdit = isOwner;
            canDelete = isOwner;
            break;
          case 'observer':
            canEdit = false;
            canDelete = false;
            break;
        }
      } else {
        // Utilizator autentificat care nu e membru - pentru proiecte publice
        if (project.visibility === 'public') {
          userRole = 'viewer';
          canEdit = false;
          canDelete = false;
        }
      }
    }
    
    res.json({
      userRole,
      canEdit,
      canDelete,
      isOwner: req.user ? observation.observer.toString() === req.user.id : false
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server');
  }
});

module.exports = router;