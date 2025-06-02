const express = require('express');
const router = express.Router();
const Observation = require('../models/Observation');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware pentru verificarea tokenului JWT
const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'Nu există token, autorizare refuzată' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tokenSecret');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalid' });
  }
};

// Funcție pentru verificarea permisiunilor
async function checkPermission(userId, projectId, action, observationId = null) {
  try {
    const project = await Project.findById(projectId).populate('members.user');
    
    if (!project) {
      return { hasPermission: false, error: 'Proiectul nu există' };
    }
    
    // Verifică dacă utilizatorul este creatorul
    if (project.creator.toString() === userId) {
      return { hasPermission: true, role: 'creator' };
    }
    
    // Verifică dacă utilizatorul este membru
    const member = project.members.find(m => m.user._id.toString() === userId);
    if (!member) {
      return { hasPermission: false, error: 'Nu sunteți membru al acestui proiect' };
    }
    
    const role = member.role;
    
    // Definirea permisiunilor pentru fiecare rol (acceptăm ambele denumiri)
    const permissions = {
      'co-investigator': ['view', 'add_observations', 'edit_own_observations', 'edit_all_observations', 'delete_own_observations', 'delete_all_observations'],
      'asistent-cercetare': ['view', 'add_observations', 'edit_own_observations', 'delete_own_observations'],
      'research-assistant': ['view', 'add_observations', 'edit_own_observations', 'delete_own_observations'], // ADĂUGAT
      'observer': ['view']
    };
    
    const userPermissions = permissions[role] || [];
    
    // Verifică permisiunea specifică
    if (action === 'edit_observation' || action === 'delete_observation') {
      if (observationId) {
        const observation = await Observation.findById(observationId);
        if (!observation) {
          return { hasPermission: false, error: 'Observația nu există' };
        }
        
        // Creator poate edita/șterge orice
        if (project.creator.toString() === userId) {
          return { hasPermission: true, role: 'creator' };
        }
        
        // Co-investigator poate edita/șterge orice observație
        if (role === 'co-investigator') {
          return { hasPermission: true, role };
        }
        
        // Asistent cercetare (ambele denumiri) poate edita/șterge doar propriile observații
        if ((role === 'asistent-cercetare' || role === 'research-assistant') && observation.observer.toString() === userId) {
          return { hasPermission: true, role };
        }
        
        // Observer nu poate edita/șterge nimic
        if (role === 'observer') {
          return { hasPermission: false, error: 'Nu aveți permisiunea să modificați observațiile' };
        }
        
        return { hasPermission: false, error: 'Nu aveți permisiunea să modificați această observație' };
      }
    }
    
    return { 
      hasPermission: userPermissions.includes(action), 
      role,
      error: userPermissions.includes(action) ? null : 'Nu aveți permisiunea pentru această acțiune'
    };
    
  } catch (error) {
    console.error('Error in checkPermission:', error);
    return { hasPermission: false, error: 'Eroare la verificarea permisiunilor' };
  }
}

// @route   POST /api/observations
// @desc    Creare observație nouă
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
    
    // Verifică permisiunile
    const permissionCheck = await checkPermission(req.user.id, projectId, 'add_observations');
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ msg: permissionCheck.error });
    }
    
    // Creare observație nouă
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
    
    // Populează datele pentru răspuns
    await observation.populate('project', 'title');
    await observation.populate('observer', 'name email');
    
    res.json(observation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   GET /api/observations/:id
// @desc    Obținere observație după ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const observation = await Observation.findById(req.params.id)
      .populate('project', 'title')
      .populate('observer', 'name email');
    
    if (!observation) {
      return res.status(404).json({ msg: 'Observația nu a fost găsită' });
    }
    
    // Verifică permisiunile de vizualizare
    const permissionCheck = await checkPermission(req.user.id, observation.project._id, 'view');
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ msg: permissionCheck.error });
    }
    
    res.json(observation);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Observația nu a fost găsită' });
    }
    
    res.status(500).send('Eroare de server');
  }
});

// @route   PUT /api/observations/:id
// @desc    Actualizare observație
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
    
    // Verifică existență observație
    let observation = await Observation.findById(req.params.id);
    
    if (!observation) {
      return res.status(404).json({ msg: 'Observația nu a fost găsită' });
    }
    
    // Verifică permisiunile de editare
    const permissionCheck = await checkPermission(req.user.id, observation.project, 'edit_observation', req.params.id);
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ msg: permissionCheck.error });
    }
    
    // Actualizare câmpuri
    if (species) observation.species = species;
    if (coordinates) observation.location.coordinates = coordinates;
    if (observationDate) observation.observationDate = observationDate;
    if (count) observation.count = count;
    if (notes !== undefined) observation.notes = notes;
    if (images) observation.images = images;
    
    await observation.save();
    
    // Populează datele pentru răspuns
    await observation.populate('project', 'title');
    await observation.populate('observer', 'name email');
    
    res.json(observation);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Observația nu a fost găsită' });
    }
    
    res.status(500).send('Eroare de server');
  }
});

// @route   DELETE /api/observations/:id
// @desc    Ștergere observație
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Verifică existență observație
    const observation = await Observation.findById(req.params.id);
    
    if (!observation) {
      return res.status(404).json({ msg: 'Observația nu a fost găsită' });
    }
    
    // Verifică permisiunile de ștergere
    const permissionCheck = await checkPermission(req.user.id, observation.project, 'delete_observation', req.params.id);
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ msg: permissionCheck.error });
    }
    
    await Observation.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Observație ștearsă' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Observația nu a fost găsită' });
    }
    
    res.status(500).send('Eroare de server');
  }
});

// @route   GET /api/observations/project/:projectId
// @desc    Obținere observații pentru un proiect specific
// @access  Private
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    // Verifică permisiunile de vizualizare
    const permissionCheck = await checkPermission(req.user.id, req.params.projectId, 'view');
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
// @desc    Obținere permisiuni pentru o observație
// @access  Private
router.get('/:id/permissions', authMiddleware, async (req, res) => {
  try {
    const observation = await Observation.findById(req.params.id);
    
    if (!observation) {
      return res.status(404).json({ msg: 'Observația nu a fost găsită' });
    }
    
    const project = await Project.findById(observation.project).populate('members.user');
    
    if (!project) {
      return res.status(404).json({ msg: 'Proiectul nu a fost găsit' });
    }
    
    // Verifică rolul utilizatorului
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
          case 'research-assistant': // ADĂUGAT
            canEdit = isOwner;
            canDelete = isOwner;
            break;
          case 'observer':
            canEdit = false;
            canDelete = false;
            break;
        }
      }
    }
    
    res.json({
      userRole,
      canEdit,
      canDelete,
      isOwner: observation.observer.toString() === req.user.id
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server');
  }
});

module.exports = router;