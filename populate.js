const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import modele
const User = require('./src/models/User');
const Project = require('./src/models/Project');
const Observation = require('./src/models/Observation');

// Conectare la baza de date
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zoocollab');
    console.log('✅ Conectat la MongoDB');
  } catch (err) {
    console.error('❌ Eroare la conectarea la MongoDB:', err.message);
    process.exit(1);
  }
};

// Date de test
const sampleUsers = [
  {
    name: 'Dr. Maria Popescu',
    email: 'maria.popescu@unibuc.ro',
    password: '123456',
    institution: 'Universitatea din București',
    specialization: 'Ornitologie',
    role: 'cercetător'
  },
  {
    name: 'Prof. Ion Marinescu',
    email: 'ion.marinescu@ubb.ro',
    password: '123456',
    institution: 'Universitatea Babeș-Bolyai',
    specialization: 'Mamalogie',
    role: 'cercetător'
  },
  {
    name: 'Ana Georgescu',
    email: 'ana.georgescu@student.unibuc.ro',
    password: '123456',
    institution: 'Universitatea din București',
    specialization: 'Herpetologie',
    role: 'student'
  },
  {
    name: 'Dr. Mihai Constantinescu',
    email: 'mihai.const@iser.ro',
    password: '123456',
    institution: 'Institutul de Speologie Emil Racoviță',
    specialization: 'Entomologie',
    role: 'cercetător'
  },
  {
    name: 'Elena Dumitrescu',
    email: 'elena.dumitrescu@bio.ro',
    password: '123456',
    institution: 'Academia Română',
    specialization: 'Ecologie',
    role: 'cercetător'
  }
];

const sampleProjects = [
  {
    title: 'Monitorizarea păsărilor migratoare din Delta Dunării',
    description: 'Proiect de monitorizare pe termen lung a speciilor de păsări migratoare din rezervația biosferei Delta Dunării. Obiectivul principal este identificarea tendințelor populaționale și a impactului schimbărilor climatice asupra rutelor de migrație.',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-11-30'),
    status: 'activ',
    isPublic: true,
    targetSpecies: [
      { scientificName: 'Pelecanus crispus', commonName: 'Pelican creț' },
      { scientificName: 'Ciconia ciconia', commonName: 'Barza albă' },
      { scientificName: 'Ardea cinerea', commonName: 'Bâtlan cenușiu' }
    ]
  },
  {
    title: 'Studiu genetic al populațiilor de urs brun din Carpați',
    description: 'Cercetare genetică avansată pentru determinarea structurii populaționale și a gradului de fragmentare a habitatului ursului brun în Munții Carpați. Proiectul include colectarea de probe non-invazive și analiza ADN.',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2025-01-15'),
    status: 'activ',
    isPublic: false,
    targetSpecies: [
      { scientificName: 'Ursus arctos', commonName: 'Urs brun' }
    ]
  },
  {
    title: 'Inventarierea herpetofaunei din Parcul Național Retezat',
    description: 'Inventariere completă a speciilor de amfibieni și reptile din Parcul Național Retezat cu focus pe identificarea speciilor endemice și evaluarea statutului de conservare.',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-09-30'),
    status: 'planificat',
    isPublic: true,
    targetSpecies: [
      { scientificName: 'Salamandra salamandra', commonName: 'Salamandra pătată' },
      { scientificName: 'Triturus cristatus', commonName: 'Triton cu creastă' },
      { scientificName: 'Lacerta agilis', commonName: 'Șopârlă de nisip' }
    ]
  },
  {
    title: 'Monitorizarea biodiversității în peșterile din Apuseni',
    description: 'Studiu complet al faunei cavernicole din sistemul de peșteri din Munții Apuseni, cu accent pe speciile endemice și rare adaptate la viața subterană.',
    startDate: new Date('2024-05-01'),
    endDate: new Date('2024-12-31'),
    status: 'activ',
    isPublic: false,
    targetSpecies: [
      { scientificName: 'Niphargus', commonName: 'Amfipod cavernicol' },
      { scientificName: 'Mesoniscus graniger', commonName: 'Izopod cavernicol' }
    ]
  },
  {
    title: 'Impactul poluării asupra ecosistemelor acvatice',
    description: 'Evaluarea impactului poluării industriale și urbane asupra biodiversității ecosistemelor acvatice din bazinul inferior al râului Mureș.',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-08-31'),
    status: 'activ',
    isPublic: true,
    targetSpecies: [
      { scientificName: 'Barbus barbus', commonName: 'Mreană' },
      { scientificName: 'Esox lucius', commonName: 'Știucă' },
      { scientificName: 'Cyprinus carpio', commonName: 'Crap' }
    ]
  }
];

// Funcție pentru crearea utilizatorilor
async function createUsers() {
  console.log('🧑‍🔬 Creează utilizatori...');
  
  const users = [];
  
  for (const userData of sampleUsers) {
    // Verifică dacă utilizatorul există deja
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log(`   ⚠️ Utilizatorul ${userData.email} există deja`);
      users.push(existingUser);
      continue;
    }
    
    // Creează utilizator nou
    const user = new User(userData);
    await user.save();
    users.push(user);
    console.log(`   ✅ Creat: ${user.name} (${user.email})`);
  }
  
  return users;
}

// Funcție pentru crearea proiectelor
async function createProjects(users) {
  console.log('📋 Creează proiecte...');
  
  const projects = [];
  
  for (let i = 0; i < sampleProjects.length; i++) {
    const projectData = sampleProjects[i];
    
    // Verifică dacă proiectul există deja
    const existingProject = await Project.findOne({ title: projectData.title });
    if (existingProject) {
      console.log(`   ⚠️ Proiectul "${projectData.title}" există deja`);
      projects.push(existingProject);
      continue;
    }
    
    // Alege un creator aleator
    const creator = users[i % users.length];
    
    // Creează proiect
    const project = new Project({
      ...projectData,
      creator: creator._id,
      members: []
    });
    
    // Adaugă membri aleatori (nu și creatorul)
    const otherUsers = users.filter(u => u._id.toString() !== creator._id.toString());
    const roles = ['co-investigator', 'research-assistant', 'observer'];
    
    const numMembers = Math.floor(Math.random() * 3) + 1; // 1-3 membri
    for (let j = 0; j < numMembers && j < otherUsers.length; j++) {
      project.members.push({
        user: otherUsers[j]._id,
        role: roles[j % roles.length],
        joinedDate: new Date()
      });
    }
    
    await project.save();
    projects.push(project);
    console.log(`   ✅ Creat: "${project.title}" de ${creator.name}`);
  }
  
  return projects;
}

// Funcție pentru crearea observațiilor
async function createObservations(users, projects) {
  console.log('🔬 Creează observații...');
  
  const observations = [];
  
  // Coordonate pentru zone din România
  const locations = [
    { name: 'Delta Dunării', coords: [29.5, 45.1] },
    { name: 'Carpații Meridionali', coords: [25.4, 45.6] },
    { name: 'Parcul Național Retezat', coords: [22.9, 45.4] },
    { name: 'Munții Apuseni', coords: [23.1, 46.4] },
    { name: 'Râul Mureș', coords: [23.8, 46.2] },
    { name: 'Rezervația Pietrosu', coords: [24.6, 47.1] },
    { name: 'Parcul Natural Bucegi', coords: [25.5, 45.4] }
  ];
  
  for (const project of projects) {
    // Creează 3-8 observații per proiect
    const numObservations = Math.floor(Math.random() * 6) + 3;
    
    for (let i = 0; i < numObservations; i++) {
      // Alege un observator (creator sau membru)
      let observer;
      if (Math.random() < 0.5) {
        observer = project.creator;
      } else if (project.members.length > 0) {
        const randomMember = project.members[Math.floor(Math.random() * project.members.length)];
        observer = randomMember.user;
      } else {
        observer = project.creator;
      }
      
      // Alege o specie din proiect sau una aleatorie
      let species;
      if (project.targetSpecies.length > 0) {
        species = project.targetSpecies[Math.floor(Math.random() * project.targetSpecies.length)];
      } else {
        species = {
          scientificName: 'Rattus norvegicus',
          commonName: 'Șobolan maro'
        };
      }
      
      // Alege o locație
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      // Generează date aleatorii în intervalul proiectului
      const startDate = new Date(project.startDate);
      const endDate = project.endDate ? new Date(project.endDate) : new Date();
      const observationDate = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      );
      
      const observation = new Observation({
        project: project._id,
        observer: observer,
        species: species,
        location: {
          type: 'Point',
          coordinates: [
            location.coords[0] + (Math.random() - 0.5) * 0.1, // Variația longitudinii
            location.coords[1] + (Math.random() - 0.5) * 0.1  // Variația latitudinii
          ]
        },
        observationDate: observationDate,
        count: Math.floor(Math.random() * 20) + 1,
        notes: `Observație în zona ${location.name}. ${generateRandomNote()}`
      });
      
      await observation.save();
      observations.push(observation);
    }
    
    console.log(`   ✅ Creat ${numObservations} observații pentru "${project.title}"`);
  }
  
  return observations;
}

// Funcție pentru generarea notelor aleatorii
function generateRandomNote() {
  const notes = [
    'Vremea însorită, vizibilitate bună.',
    'Condițiile meteorologice ideale pentru observații.',
    'Activitate intensă în zona de hrănire.',
    'Comportament normal, fără perturbări.',
    'Prezența juvenililor observată.',
    'Zona cu vegetație deasă.',
    'Habitat în stare bună de conservare.',
    'Nu s-au observat amenințări directe.',
    'Activitate în orele matinale.',
    'Comportament de reproducere observat.'
  ];
  
  return notes[Math.floor(Math.random() * notes.length)];
}

// Funcția principală
async function populateDatabase() {
  try {
    console.log('🚀 Pornesc popularea bazei de date...\n');
    
    await connectDB();
    
    // Șterge datele existente (opțional)
    console.log('🧹 Curăț baza de date...');
    await Observation.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({});
    console.log('   ✅ Baza de date curățată\n');
    
    // Creează utilizatori
    const users = await createUsers();
    console.log(`   📊 Total utilizatori creați: ${users.length}\n`);
    
    // Creează proiecte
    const projects = await createProjects(users);
    console.log(`   📊 Total proiecte create: ${projects.length}\n`);
    
    // Creează observații
    const observations = await createObservations(users, projects);
    console.log(`   📊 Total observații create: ${observations.length}\n`);
    
    console.log('🎉 Popularea bazei de date finalizată cu succes!');
    
    // Afișează informații de login
    console.log('\n📧 Conturi de test create:');
    sampleUsers.forEach(user => {
      console.log(`   Email: ${user.email} | Parolă: ${user.password}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Eroare la popularea bazei de date:', error);
    process.exit(1);
  }
}

// Rulează scriptul dacă este apelat direct
if (require.main === module) {
  populateDatabase();
}

module.exports = { populateDatabase };