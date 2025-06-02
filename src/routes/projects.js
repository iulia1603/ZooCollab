const express = require('express');
const router = express.Router();
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

// Middleware opțional pentru autentificare (permite accesul fără token)
const optionalAuthMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tokenSecret');
      req.user = decoded.user;
    } catch (err) {
      // Token invalid, dar continuăm fără autentificare
      req.user = null;
    }
  }
  next();
};

// Funcție pentru verificarea dacă utilizatorul are acces la proiect
function hasProjectAccess(project, userId) {
  // Dacă proiectul este public, oricine poate vizualiza
  if (project.isPublic) {
    return { hasAccess: true, accessType: 'public' };
  }
  
  // Pentru proiecte private, verifică dacă utilizatorul este creator sau membru
  if (!userId) {
    return { hasAccess: false, accessType: 'private' };
  }
  
  // Verifică dacă utilizatorul este creatorul
  if (project.creator.toString() === userId || project.creator._id.toString() === userId) {
    return { hasAccess: true, accessType: 'creator' };
  }
  
  // Verifică dacă utilizatorul este membru
  const isMember = project.members.some(member => {
    const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
    return memberId === userId;
  });
  
  return { 
    hasAccess: isMember, 
    accessType: isMember ? 'member' : 'private' 
  };
}

// @route   GET /api/projects
// @desc    Obținere proiecte (publice + private în care utilizatorul e implicat)
// @access  Public/Private
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    console.log('Getting projects for user:', req.user?.id || 'anonymous');
    
    let query = {};
    
    if (req.user?.id) {
      // Utilizator autentificat: proiecte publice + proiectele sale private
      query = {
        $or: [
          { isPublic: true },
          { creator: req.user.id },
          { 'members.user': req.user.id }
        ]
      };
    } else {
      // Utilizator neautentificat: doar proiecte publice
      query = { isPublic: true };
    }
    
    const projects = await Project.find(query)
      .populate('creator', 'name email institution')
      .populate('members.user', 'name email institution')
      .sort({ createdAt: -1 });
    
    console.log('Found projects:', projects.length);
    res.json(projects);
  } catch (err) {
    console.error('Error getting projects:', err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   GET /api/projects/public
// @desc    Obținere doar proiecte publice
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const projects = await Project.find({ isPublic: true })
      .populate('creator', 'name email institution')
      .populate('members.user', 'name email institution')
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (err) {
    console.error('Error getting public projects:', err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   GET /api/projects/my
// @desc    Obținere proiectele utilizatorului curent
// @access  Private
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { creator: req.user.id },
        { 'members.user': req.user.id }
      ]
    })
      .populate('creator', 'name email institution')
      .populate('members.user', 'name email institution')
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (err) {
    console.error('Error getting user projects:', err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   POST /api/projects
// @desc    Creare proiect nou
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, startDate, endDate, status, targetSpecies, isPublic } = req.body;
    
    const newProject = new Project({
      title,
      description,
      startDate,
      endDate,
      status,
      targetSpecies,
      isPublic: isPublic || false, // Default: privat
      creator: req.user.id
    });
    
    const project = await newProject.save();
    
    // Populează datele pentru răspuns
    await project.populate('creator', 'name email institution');
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   GET /api/projects/:id
// @desc    Obținere proiect după ID (respectă regulile de acces)
// @access  Public/Private
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    console.log('Getting project:', req.params.id, 'for user:', req.user?.id || 'anonymous');
    
    const project = await Project.findById(req.params.id)
      .populate('creator', 'name email institution')
      .populate('members.user', 'name email institution');
    
    if (!project) {
      console.log('Project not found');
      return res.status(404).json({ msg: 'Proiectul nu a fost găsit' });
    }

    console.log('Project found, checking access...');
    console.log('Project is public:', project.isPublic);
    console.log('Project creator:', project.creator._id.toString());
    console.log('Current user:', req.user?.id || 'anonymous');

    // Verifică accesul
    const accessCheck = hasProjectAccess(project, req.user?.id);

    if (!accessCheck.hasAccess) {
      console.log('Access denied for user');
      return res.status(403).json({ 
        msg: 'Nu aveți permisiunea să accesați acest proiect privat' 
      });
    }
    
    console.log('Access granted - type:', accessCheck.accessType);
    
    // Adaugă informații despre tipul de acces în răspuns
    const response = {
      ...project.toObject(),
      accessInfo: {
        accessType: accessCheck.accessType,
        canEdit: accessCheck.accessType === 'creator',
        canManageMembers: accessCheck.accessType === 'creator',
        canAddObservations: ['creator', 'member'].includes(accessCheck.accessType)
      }
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error getting project:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Proiectul nu a fost găsit' });
    }
    
    res.status(500).send('Eroare de server');
  }
});

// @route   PUT /api/projects/:id
// @desc    Actualizare proiect (doar creatorul)
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, startDate, endDate, status, targetSpecies, isPublic } = req.body;
    
    // Verificare existență proiect
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'Proiectul nu a fost găsit' });
    }
    
    // Verificare dacă utilizatorul este creatorul proiectului
    if (project.creator.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Nu sunteți autorizat să modificați acest proiect' });
    }
    
    // Actualizare câmpuri
    project.title = title || project.title;
    project.description = description || project.description;
    project.startDate = startDate || project.startDate;
    project.endDate = endDate || project.endDate;
    project.status = status || project.status;
    project.targetSpecies = targetSpecies || project.targetSpecies;
    
    // Actualizare vizibilitate
    if (typeof isPublic === 'boolean') {
      project.isPublic = isPublic;
    }
    
    await project.save();
    
    // Populează datele pentru răspuns
    await project.populate('creator', 'name email institution');
    await project.populate('members.user', 'name email institution');
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Proiectul nu a fost găsit' });
    }
    
    res.status(500).send('Eroare de server');
  }
});

// @route   POST /api/projects/:id/members
// @desc    Adăugare membru în proiect (doar creatorul)
// @access  Private
router.post('/:id/members', authMiddleware, async (req, res) => {
  try {
    const { userEmail, role } = req.body;
    
    console.log('Adding member:', { userEmail, role, projectId: req.params.id });
    
    // Validare rol
    const validRoles = ['co-investigator', 'research-assistant', 'observer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        msg: 'Rol invalid. Rolurile permise sunt: co-investigator, research-assistant, observer' 
      });
    }
    
    // Găsește utilizatorul după email
    const User = require('../models/User');
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilizatorul nu a fost găsit' });
    }
    
    // Verificare existență proiect
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'Proiectul nu a fost găsit' });
    }
    
    // Verificare dacă utilizatorul curent este creatorul proiectului
    if (project.creator.toString() !== req.user.id) {
      return res.status(401).json({ 
        msg: 'Nu sunteți autorizat să adăugați membri în acest proiect' 
      });
    }
    
    // Verificare dacă utilizatorul este deja membru
    if (project.members.some(member => member.user.toString() === user._id.toString())) {
      return res.status(400).json({ msg: 'Utilizatorul este deja membru al proiectului' });
    }
    
    // Verificare dacă utilizatorul este creatorul
    if (project.creator.toString() === user._id.toString()) {
      return res.status(400).json({ msg: 'Creatorul proiectului este automat membru' });
    }
    
    // Adaugă membrul
    project.members.push({
      user: user._id,
      role: role,
      joinedDate: new Date()
    });
    
    await project.save();
    
    // Populează datele pentru răspuns
    await project.populate('members.user', 'name email institution');
    
    console.log('Member added successfully');
    res.json({
      msg: 'Membru adăugat cu succes',
      members: project.members
    });
  } catch (err) {
    console.error('Error adding member:', err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Eliminare membru din proiect (doar creatorul)
// @access  Private
router.delete('/:id/members/:userId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'Proiectul nu a fost găsit' });
    }
    
    // Verificare dacă utilizatorul curent este creatorul proiectului
    if (project.creator.toString() !== req.user.id) {
      return res.status(401).json({ 
        msg: 'Nu sunteți autorizat să eliminați membri din acest proiect' 
      });
    }
    
    // Găsește și elimină membrul
    const memberIndex = project.members.findIndex(
      member => member.user.toString() === req.params.userId
    );
    
    if (memberIndex === -1) {
      return res.status(404).json({ msg: 'Membrul nu a fost găsit în proiect' });
    }
    
    project.members.splice(memberIndex, 1);
    await project.save();
    
    res.json({ msg: 'Membru eliminat cu succes' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   PUT /api/projects/:id/members/:userId/role
// @desc    Actualizare rol membru (doar creatorul)
// @access  Private
router.put('/:id/members/:userId/role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    
    console.log('Updating member role:', { 
      projectId: req.params.id, 
      userId: req.params.userId, 
      newRole: role 
    });
    
    // Validare rol
    const validRoles = ['co-investigator', 'research-assistant', 'observer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        msg: 'Rol invalid. Rolurile permise sunt: co-investigator, research-assistant, observer' 
      });
    }
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'Proiectul nu a fost găsit' });
    }
    
    // Verificare dacă utilizatorul curent este creatorul proiectului
    if (project.creator.toString() !== req.user.id) {
      return res.status(401).json({ 
        msg: 'Nu sunteți autorizat să modificați rolurile în acest proiect' 
      });
    }
    
    // Găsește și actualizează rolul membrului
    const member = project.members.find(
      member => member.user.toString() === req.params.userId
    );
    
    if (!member) {
      return res.status(404).json({ msg: 'Membrul nu a fost găsit în proiect' });
    }
    
    member.role = role;
    await project.save();
    
    console.log('Member role updated successfully');
    res.json({ msg: 'Rolul a fost actualizat cu succes' });
  } catch (err) {
    console.error('Error updating member role:', err.message);
    res.status(500).send('Eroare de server');
  }
});

module.exports = router;