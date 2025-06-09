const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Observation = require('../models/Observation');
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

// @route   GET /api/profile/stats
// @desc    Obținere statistici pentru profilul utilizatorului
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    console.log('Getting profile stats for user:', req.user.id);
    
    // Găsește proiectele în care utilizatorul este implicat
    const userProjects = await Project.find({
      $or: [
        { creator: req.user.id },
        { 'members.user': req.user.id }
      ]
    });
    
    // Găsește observațiile create de utilizator
    const userObservations = await Observation.find({
      observer: req.user.id
    });
    
    // Calculează statistici detaliate
    const stats = {
      totalProjects: userProjects.length,
      createdProjects: userProjects.filter(p => p.creator.toString() === req.user.id).length,
      memberProjects: userProjects.filter(p => 
        p.creator.toString() !== req.user.id && 
        p.members.some(m => m.user.toString() === req.user.id)
      ).length,
      publicProjects: userProjects.filter(p => p.isPublic && p.creator.toString() === req.user.id).length,
      privateProjects: userProjects.filter(p => !p.isPublic && p.creator.toString() === req.user.id).length,
      totalObservations: userObservations.length,
      projectsByStatus: {
        planificat: userProjects.filter(p => p.status === 'planificat').length,
        activ: userProjects.filter(p => p.status === 'activ').length,
        finalizat: userProjects.filter(p => p.status === 'finalizat').length,
        suspendat: userProjects.filter(p => p.status === 'suspendat').length
      },
      observationsByMonth: {},
      topSpecies: []
    };
    
    // Calculează observațiile pe luni (ultimele 12 luni)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const recentObservations = userObservations.filter(obs => 
      new Date(obs.observationDate) >= oneYearAgo
    );
    
    // Grupează observațiile pe luni
    recentObservations.forEach(obs => {
      const date = new Date(obs.observationDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!stats.observationsByMonth[monthKey]) {
        stats.observationsByMonth[monthKey] = 0;
      }
      stats.observationsByMonth[monthKey]++;
    });
    
    // Calculează speciile cel mai des observate
    const speciesCount = {};
    userObservations.forEach(obs => {
      const species = obs.species.scientificName;
      if (!speciesCount[species]) {
        speciesCount[species] = {
          scientificName: species,
          commonName: obs.species.commonName,
          count: 0,
          totalIndividuals: 0
        };
      }
      speciesCount[species].count++;
      speciesCount[species].totalIndividuals += obs.count;
    });
    
    // Sortează speciile după numărul de observații
    stats.topSpecies = Object.values(speciesCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 specii
    
    console.log('Profile stats calculated:', stats);
    res.json(stats);
  } catch (err) {
    console.error('Error getting profile stats:', err.message);
    res.status(500).send('Eroare de server');
  }
});

// @route   GET /api/profile/activity
// @desc    Obținere activitate recentă a utilizatorului
// @access  Private
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    console.log('Getting recent activity for user:', req.user.id);
    
    // Observații recente (ultimele 10)
    const recentObservations = await Observation.find({
      observer: req.user.id
    })
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Proiecte create recent (ultimele 5)
    const recentProjects = await Project.find({
      creator: req.user.id
    })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Proiecte în care a fost adăugat recent ca membru
    const recentMemberships = await Project.find({
      'members.user': req.user.id
    })
      .populate('creator', 'name')
      .sort({ 'members.joinedDate': -1 })
      .limit(5);
    
    const activity = {
      recentObservations: recentObservations.map(obs => ({
        id: obs._id,
        species: obs.species.scientificName,
        commonName: obs.species.commonName,
        date: obs.observationDate,
        project: obs.project.title,
        createdAt: obs.createdAt
      })),
      recentProjects: recentProjects.map(proj => ({
        id: proj._id,
        title: proj.title,
        status: proj.status,
        isPublic: proj.isPublic,
        membersCount: proj.members.length,
        createdAt: proj.createdAt
      })),
      recentMemberships: recentMemberships.map(proj => {
        const membership = proj.members.find(m => m.user.toString() === req.user.id);
        return {
          id: proj._id,
          title: proj.title,
          creator: proj.creator.name,
          role: membership ? membership.role : 'unknown',
          joinedDate: membership ? membership.joinedDate : null
        };
      })
    };
    
    console.log('Activity data calculated');
    res.json(activity);
  } catch (err) {
    console.error('Error getting activity:', err.message);
    res.status(500).send('Eroare de server');
  }
});

module.exports = router;