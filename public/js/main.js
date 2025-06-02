// State global al aplicației
const state = {
  isAuthenticated: false,
  token: null,
  user: null,
  projects: [],
  currentProject: null,
  currentSection: 'home-section'
};

// DOM Selectors
const selectors = {
  sections: {
    home: document.getElementById('home-section'),
    login: document.getElementById('login-section'),
    register: document.getElementById('register-section'),
    projects: document.getElementById('projects-section'),
    projectForm: document.getElementById('project-form-section'),
    projectDetails: document.getElementById('project-details-section'),
    observationForm: document.getElementById('observation-form-section')
  },
  nav: {
    home: document.querySelector('nav a.active'),
    projects: document.getElementById('projects-link'),
    login: document.getElementById('login-link'),
    register: document.getElementById('register-link')
  },
  forms: {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form'),
    project: document.getElementById('project-form'),
    observation: document.getElementById('observation-form')
  },
  buttons: {
    getStarted: document.getElementById('get-started-btn'),
    addProject: document.getElementById('add-project-btn'),
    cancelProject: document.getElementById('cancel-project-btn'),
    backToProjects: document.getElementById('back-to-projects-btn'),
    addObservation: document.getElementById('add-observation-btn'),
    cancelObservation: document.getElementById('cancel-observation-btn')
  },
  containers: {
    projectsList: document.getElementById('projects-list'),
    projectDetails: document.getElementById('project-details'),
    projectObservations: document.getElementById('project-observations')
  },
  messages: {
    noProjects: document.getElementById('no-projects-message'),
    noObservations: document.getElementById('no-observations-message')
  },
  modal: {
    notification: document.getElementById('notification-modal'),
    message: document.getElementById('notification-message'),
    close: document.querySelector('.close')
  },
  links: {
    toRegister: document.getElementById('to-register-link'),
    toLogin: document.getElementById('to-login-link')
  }
};

// Funcții de utilitate
const api = {
  baseUrl: 'http://localhost:5000/api',
  
  async request(endpoint, method = 'GET', data = null) {
    console.log(`🔄 API Request: ${method} ${endpoint}`, { data, token: state.token ? 'exists' : 'none' });
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (state.token) {
      options.headers['x-auth-token'] = state.token;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const responseData = await response.json();
      
      console.log(`📡 API Response: ${response.status}`, responseData);
      
      if (!response.ok) {
        console.error(`❌ API Error: ${response.status}`, responseData);
        throw new Error(responseData.msg || 'A apărut o eroare');
      }
      
      return responseData;
    } catch (error) {
      console.error('🚨 API Request Failed:', error);
      showNotification(error.message);
      throw error;
    }
  },
  
  // Autentificare
  async register(userData) {
    return this.request('/auth/register', 'POST', userData);
  },
  
  async login(credentials) {
    return this.request('/auth/login', 'POST', credentials);
  },
  
  async getCurrentUser() {
    return this.request('/auth/user');
  },
  
  // Proiecte
  async getProjects() {
    return this.request('/projects');
  },
  
  async createProject(projectData) {
    return this.request('/projects', 'POST', projectData);
  },
  
  async getProject(id) {
    return this.request(`/projects/${id}`);
  },
  
  async updateProject(id, projectData) {
    return this.request(`/projects/${id}`, 'PUT', projectData);
  },
  
  async deleteProject(id) {
    return this.request(`/projects/${id}`, 'DELETE');
  },
  
  // Observații
  async createObservation(observationData) {
    return this.request('/observations', 'POST', observationData);
  },
  
  async getProjectObservations(projectId) {
    return this.request(`/observations/project/${projectId}`);
  },

  async editObservation(observationId, observationData) {
    return this.request(`/observations/${observationId}`, 'PUT', observationData);
  },

  async deleteObservation(observationId) {
    return this.request(`/observations/${observationId}`, 'DELETE');
  },

  async getObservationPermissions(observationId) {
    return this.request(`/observations/${observationId}/permissions`);
  },

  // Membri proiect
  async addProjectMember(projectId, userEmail, role) {
    return this.request(`/projects/${projectId}/members`, 'POST', {
      userEmail,
      role
    });
  },

  async removeProjectMember(projectId, userId) {
    return this.request(`/projects/${projectId}/members/${userId}`, 'DELETE');
  },

  async updateMemberRole(projectId, userId, role) {
    return this.request(`/projects/${projectId}/members/${userId}/role`, 'PUT', {
      role
    });
  }
};

// Funcții de afișare UI
function showSection(sectionId) {
  console.log(`🖥️ Switching to section: ${sectionId}`);
  
  // Ascunde toate secțiunile
  Object.values(selectors.sections).forEach(section => {
    section.classList.add('section-hidden');
    section.classList.remove('section-visible');
  });
  
  // Afișează secțiunea selectată
  const section = selectors.sections[sectionId];
  if (section) {
    section.classList.remove('section-hidden');
    section.classList.add('section-visible');
    state.currentSection = section.id;
  }
}

function showNotification(message) {
  console.log(`🔔 Notification: ${message}`);
  selectors.modal.message.textContent = message;
  selectors.modal.notification.style.display = 'block';
}

function updateNavigation() {
  if (state.isAuthenticated) {
    selectors.nav.login.textContent = 'Profil';
    selectors.nav.register.textContent = 'Deconectare';
  } else {
    selectors.nav.login.textContent = 'Autentificare';
    selectors.nav.register.textContent = 'Înregistrare';
  }
}

// Funcții pentru gestionarea proiectelor
function renderProjects() {
  console.log(`🏗️ Rendering ${state.projects.length} projects`);
  
  const container = selectors.containers.projectsList;
  const noProjectsMessage = selectors.messages.noProjects;
  
  // Curăță containerul
  container.innerHTML = '';
  
  if (state.projects.length === 0) {
    noProjectsMessage.style.display = 'block';
    return;
  }
  
  noProjectsMessage.style.display = 'none';
  
  // Randează fiecare proiect
  state.projects.forEach(project => {
    console.log(`📋 Rendering project: ${project.title} (ID: ${project._id})`);
    
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    
    const statusClass = `status-${project.status}`;
    
    projectCard.innerHTML = `
      <h3>${project.title}</h3>
      <span class="status ${statusClass}">${project.status}</span>
      <p>${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
      <div class="project-actions">
        <button class="btn btn-sm view-project" data-id="${project._id}">Vizualizare</button>
      </div>
    `;
    
    container.appendChild(projectCard);
    
    // Adaugă event listener pentru butonul de vizualizare
    projectCard.querySelector('.view-project').addEventListener('click', () => {
      console.log(`🎯 User clicked to view project: ${project._id}`);
      viewProject(project._id);
    });
  });
}

async function viewProject(projectId) {
  console.log(`👀 Attempting to view project: ${projectId}`);
  console.log(`👤 Current user:`, state.user);
  
  try {
    console.log(`🔍 Fetching project details...`);
    state.currentProject = await api.getProject(projectId);
    
    console.log(`✅ Project fetched successfully:`, state.currentProject);
    console.log(`🔑 User role check:`, {
      isCreator: state.user && state.currentProject.creator._id === state.user._id,
      userId: state.user?._id,
      creatorId: state.currentProject.creator._id,
      members: state.currentProject.members.map(m => ({
        userId: m.user._id,
        userName: m.user.name,
        role: m.role
      }))
    });
    
    renderProjectDetails();
    
    // Obține observațiile pentru acest proiect
    console.log(`📊 Fetching observations for project...`);
    const observations = await api.getProjectObservations(projectId);
    console.log(`📊 Observations fetched:`, observations);
    
    renderProjectObservations(observations);
    
    showSection('projectDetails');
  } catch (error) {
    console.error('💥 Error viewing project:', error);
  }
}

function renderProjectDetails() {
  const project = state.currentProject;
  const container = selectors.containers.projectDetails;
  
  if (!project) {
    console.warn('⚠️ No current project to render');
    return;
  }
  
  console.log(`🎨 Rendering project details for: ${project.title}`);
  
  const startDate = new Date(project.startDate).toLocaleDateString('ro-RO');
  const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString('ro-RO') : 'Nedefinit';
  
  // Verifică dacă utilizatorul curent este creatorul
  const isCreator = state.user && project.creator._id === state.user._id;
  console.log(`👑 Is creator check:`, { isCreator, userId: state.user?._id, creatorId: project.creator._id });
  
  container.innerHTML = `
    <h2>${project.title}</h2>
    <div class="metadata">
      <div>
        <strong>Status:</strong> 
        <span class="status status-${project.status}">${project.status}</span>
      </div>
      <div>
        <strong>Data început:</strong> ${startDate}
      </div>
      <div>
        <strong>Data sfârșit:</strong> ${endDate}
      </div>
      <div>
        <strong>Creator:</strong> ${project.creator.name}
      </div>
    </div>
    
    <div class="description">
      <h3>Descriere</h3>
      <p>${project.description}</p>
    </div>
    
    <div class="members">
      <div class="members-header">
        <h3>Membri echipei (${project.members.length + 1})</h3>
        ${isCreator ? '<button id="add-member-btn" class="btn btn-sm">Adaugă membru</button>' : ''}
      </div>
      
      <ul class="members-list">
        <li class="member-item creator">
          <div class="member-info">
            <strong>${project.creator.name}</strong> (${project.creator.email})
            <span class="member-role">Creator</span>
            <small>${project.creator.institution}</small>
          </div>
        </li>
        ${project.members.map(member => `
          <li class="member-item">
            <div class="member-info">
              <strong>${member.user.name}</strong> (${member.user.email})
              <span class="member-role">${member.role}</span>
              <small>${member.user.institution}</small>
            </div>
            ${isCreator ? `
              <div class="member-actions">
                <button class="btn btn-sm btn-secondary edit-member-role" data-user-id="${member.user._id}" data-current-role="${member.role}">
                  Editează rol
                </button>
                <button class="btn btn-sm btn-danger remove-member" data-user-id="${member.user._id}">
                  Elimină
                </button>
              </div>
            ` : ''}
          </li>
        `).join('')}
      </ul>
      
      ${isCreator ? `
        <div id="add-member-form" class="add-member-form" style="display: none;">
          <h4>Adaugă membru nou</h4>
          <div class="form-group">
            <label for="member-email">Email utilizator</label>
            <input type="email" id="member-email" placeholder="exemplu@email.com" required>
          </div>
          <div class="form-group">
            <label for="member-role">Rol în proiect</label>
            <select id="member-role" required>
              <option value="co-investigator">Co-investigator</option>
              <option value="research-assistant">Research Assistant</option>
              <option value="observer">Observer</option>
            </select>
          </div>
          <div class="form-actions">
            <button id="cancel-add-member" class="btn btn-secondary">Anulează</button>
            <button id="confirm-add-member" class="btn btn-primary">Adaugă</button>
          </div>
        </div>
      ` : ''}
    </div>
    
    <div class="target-species">
      <h3>Specii țintă</h3>
      ${project.targetSpecies && project.targetSpecies.length > 0 ? 
        `<ul>${project.targetSpecies.map(species => 
          `<li>${species.scientificName} ${species.commonName ? `(${species.commonName})` : ''}</li>`).join('')}
        </ul>` : 
        '<p>Nu au fost definite specii țintă.</p>'}
    </div>
  `;
  
  // Adaugă event listeners pentru gestionarea membrilor
  if (isCreator) {
    setupMemberManagementListeners();
  }
}

// Event listeners pentru gestionarea membrilor
function setupMemberManagementListeners() {
  console.log(`🔧 Setting up member management listeners`);
  
  const addMemberBtn = document.getElementById('add-member-btn');
  const addMemberForm = document.getElementById('add-member-form');
  const cancelAddMember = document.getElementById('cancel-add-member');
  const confirmAddMember = document.getElementById('confirm-add-member');
  const removeButtons = document.querySelectorAll('.remove-member');
  const editRoleButtons = document.querySelectorAll('.edit-member-role');
  
  if (addMemberBtn) {
    addMemberBtn.addEventListener('click', () => {
      addMemberForm.style.display = 'block';
      addMemberBtn.style.display = 'none';
    });
  }
  
  if (cancelAddMember) {
    cancelAddMember.addEventListener('click', () => {
      addMemberForm.style.display = 'none';
      addMemberBtn.style.display = 'inline-block';
      document.getElementById('member-email').value = '';
      document.getElementById('member-role').value = 'co-investigator';
    });
  }
  
  if (confirmAddMember) {
    confirmAddMember.addEventListener('click', async () => {
      const email = document.getElementById('member-email').value;
      const role = document.getElementById('member-role').value;
      
      if (!email) {
        showNotification('Vă rugăm să introduceți email-ul utilizatorului');
        return;
      }
      
      try {
        await api.addProjectMember(state.currentProject._id, email, role);
        
        // Reîncarcă detaliile proiectului
        state.currentProject = await api.getProject(state.currentProject._id);
        renderProjectDetails();
      } catch (error) {
        console.error('Error adding member:', error);
      }
    });
  }
  
  // Event listeners pentru eliminarea membrilor
  removeButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const userId = button.getAttribute('data-user-id');
      const memberName = button.closest('.member-item').querySelector('strong').textContent;
      
      if (confirm(`Sunteți sigur că doriți să eliminați pe ${memberName} din proiect?`)) {
        try {
          await api.removeProjectMember(state.currentProject._id, userId);
          
          // Reîncarcă detaliile proiectului
          state.currentProject = await api.getProject(state.currentProject._id);
          renderProjectDetails();
        } catch (error) {
          console.error('Error removing member:', error);
        }
      }
    });
  });

  // Event listeners pentru editarea rolului
  editRoleButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const userId = button.getAttribute('data-user-id');
      const currentRole = button.getAttribute('data-current-role');
      const memberName = button.closest('.member-item').querySelector('strong').textContent;
      
      // Creează modal pentru selectarea rolului
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'block';
      
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close">&times;</span>
          <h3>Editează rolul pentru ${memberName}</h3>
          <div class="form-group">
            <label for="edit-role-select">Selectați noul rol:</label>
            <select id="edit-role-select">
              <option value="co-investigator" ${currentRole === 'co-investigator' ? 'selected' : ''}>Co-investigator</option>
              <option value="research-assistant" ${currentRole === 'research-assistant' ? 'selected' : ''}>Research Assistant</option>
              <option value="observer" ${currentRole === 'observer' ? 'selected' : ''}>Observer</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary cancel-edit-role">Anulează</button>
            <button class="btn btn-primary confirm-edit-role">Salvează</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Event listeners pentru modal
      const closeBtn = modal.querySelector('.close');
      const cancelBtn = modal.querySelector('.cancel-edit-role');
      const confirmBtn = modal.querySelector('.confirm-edit-role');
      
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      confirmBtn.addEventListener('click', async () => {
        const newRole = document.getElementById('edit-role-select').value;
        
        try {
          await api.updateMemberRole(state.currentProject._id, userId, newRole);
          showNotification('Rolul a fost actualizat cu succes!');
          
          // Reîncarcă detaliile proiectului
          state.currentProject = await api.getProject(state.currentProject._id);
          renderProjectDetails();
          
          document.body.removeChild(modal);
        } catch (error) {
          console.error('Error updating role:', error);
        }
      });
    });
  });
}

// Funcții pentru gestionarea observațiilor
async function renderProjectObservations(observations) {
  console.log(`📊 Rendering ${observations.length} observations`);
  
  const container = selectors.containers.projectObservations;
  const noObservationsMessage = selectors.messages.noObservations;
  
  container.innerHTML = '';
  
  if (!observations || observations.length === 0) {
    noObservationsMessage.style.display = 'block';
    return;
  }
  
  noObservationsMessage.style.display = 'none';
  
  // Rendează fiecare observație cu permisiuni
  for (const observation of observations) {
    console.log(`🔬 Processing observation: ${observation._id}`);
    
    const observationCard = document.createElement('div');
    observationCard.className = 'observation-card';
    
    const obsDate = new Date(observation.observationDate).toLocaleDateString('ro-RO');
    
    // Obține permisiunile pentru această observație
    try {
      const permissions = await api.getObservationPermissions(observation._id);
      console.log(`🔒 Permissions for observation ${observation._id}:`, permissions);
      
      observationCard.innerHTML = `
        <div class="observation-header">
          <h3>${observation.species.scientificName}</h3>
          <div class="observation-actions">
            ${permissions.canEdit ? `
              <button class="btn btn-sm edit-observation" data-id="${observation._id}">
                Editează
              </button>
            ` : ''}
            ${permissions.canDelete ? `
              <button class="btn btn-sm btn-danger delete-observation" data-id="${observation._id}">
                Șterge
              </button>
            ` : ''}
          </div>
        </div>
        <div class="observation-content">
          <p><strong>Numele comun:</strong> ${observation.species.commonName || 'Nedefinit'}</p>
          <p><strong>Data:</strong> ${obsDate}</p>
          <p><strong>Număr exemplare:</strong> ${observation.count}</p>
          <p><strong>Coordonate:</strong> ${observation.location.coordinates[1]}, ${observation.location.coordinates[0]}</p>
          <p><strong>Observer:</strong> ${observation.observer.name}</p>
          ${observation.notes ? `<p><strong>Note:</strong> ${observation.notes}</p>` : ''}
          ${permissions.isOwner ? '<span class="owner-badge">Observația mea</span>' : ''}
          ${permissions.userRole ? `<span class="role-badge role-${permissions.userRole}">${permissions.userRole}</span>` : ''}
        </div>
      `;
      
      container.appendChild(observationCard);
      
      // Adaugă event listeners pentru butoanele de acțiune
      const editBtn = observationCard.querySelector('.edit-observation');
      const deleteBtn = observationCard.querySelector('.delete-observation');
      
      if (editBtn) {
        editBtn.addEventListener('click', () => openEditObservationModal(observation));
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => confirmDeleteObservation(observation._id, observation.species.scientificName));
      }
    } catch (error) {
      console.error(`❌ Error getting permissions for observation ${observation._id}:`, error);
    }
  }
}

// Funcție pentru deschiderea modalului de editare
function openEditObservationModal(observation) {
  // Creează modal pentru editare
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h3>Editează observația</h3>
      <form id="edit-observation-form">
        <div class="form-group">
          <label for="edit-species-scientific">Numele științific</label>
          <input type="text" id="edit-species-scientific" value="${observation.species.scientificName}" required>
        </div>
        <div class="form-group">
          <label for="edit-species-common">Numele comun</label>
          <input type="text" id="edit-species-common" value="${observation.species.commonName || ''}">
        </div>
        <div class="form-group">
          <label for="edit-latitude">Latitudine</label>
          <input type="number" id="edit-latitude" step="any" value="${observation.location.coordinates[1]}" required>
        </div>
        <div class="form-group">
          <label for="edit-longitude">Longitudine</label>
          <input type="number" id="edit-longitude" step="any" value="${observation.location.coordinates[0]}" required>
        </div>
        <div class="form-group">
          <label for="edit-date">Data observației</label>
          <input type="date" id="edit-date" value="${observation.observationDate.split('T')[0]}" required>
        </div>
        <div class="form-group">
          <label for="edit-count">Număr exemplare</label>
          <input type="number" id="edit-count" min="1" value="${observation.count}" required>
        </div>
        <div class="form-group">
          <label for="edit-notes">Note</label>
          <textarea id="edit-notes" rows="3">${observation.notes || ''}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary cancel-edit">Anulează</button>
          <button type="submit" class="btn btn-primary">Salvează modificările</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners pentru modal
  const closeBtn = modal.querySelector('.close');
  const cancelBtn = modal.querySelector('.cancel-edit');
  const form = modal.querySelector('#edit-observation-form');
  
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const updatedData = {
      species: {
        scientificName: document.getElementById('edit-species-scientific').value,
        commonName: document.getElementById('edit-species-common').value
      },
      coordinates: [
        parseFloat(document.getElementById('edit-longitude').value),
        parseFloat(document.getElementById('edit-latitude').value)
      ],
      observationDate: document.getElementById('edit-date').value,
      count: parseInt(document.getElementById('edit-count').value),
      notes: document.getElementById('edit-notes').value
    };
    
    try {
      await api.editObservation(observation._id, updatedData);
      showNotification('Observația a fost actualizată cu succes!');
      
      // Reîncarcă observațiile proiectului
      const observations = await api.getProjectObservations(state.currentProject._id);
      renderProjectObservations(observations);
      
      document.body.removeChild(modal);
    } catch (error) {
      console.error('Error updating observation:', error);
    }
  });
}

// Funcție pentru confirmarea ștergerii
function confirmDeleteObservation(observationId, speciesName) {
  if (confirm(`Sunteți sigur că doriți să ștergeți observația pentru ${speciesName}?`)) {
    deleteObservationConfirmed(observationId);
  }
}

async function deleteObservationConfirmed(observationId) {
  try {
    await api.deleteObservation(observationId);
    showNotification('Observația a fost ștearsă cu succes!');
    
    // Reîncarcă observațiile proiectului
    const observations = await api.getProjectObservations(state.currentProject._id);
    renderProjectObservations(observations);
  } catch (error) {
    console.error('Error deleting observation:', error);
  }
}

// Event listeners
function setupEventListeners() {
  console.log(`🎧 Setting up event listeners`);
  
  // Navigare
  selectors.nav.home.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('home');
  });
  
  selectors.nav.projects.addEventListener('click', (e) => {
    e.preventDefault();
    if (!state.isAuthenticated) {
      showSection('login');
      return;
    }
    loadProjects();
  });
  
  selectors.nav.login.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.isAuthenticated) {
      // Pagină profil sau deconectare
      showSection('profile');
    } else {
      showSection('login');
    }
  });
  
  selectors.nav.register.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.isAuthenticated) {
      // Deconectare
      logout();
    } else {
      showSection('register');
    }
  });
  
  // Formulare
  selectors.forms.login.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    console.log(`🔐 Attempting login for: ${email}`);
    
    try {
      const data = await api.login({ email, password });
      
      state.token = data.token;
      state.isAuthenticated = true;
      
      console.log(`✅ Login successful, token received`);
      
      // Obține informații utilizator
      await loadUserData();
      
      // Redirecționare către proiecte
      loadProjects();
      
      // Resetează formularul
      selectors.forms.login.reset();
      
      showNotification('Autentificare reușită!');
    } catch (error) {
      console.error('Login error:', error);
    }
  });
  
  selectors.forms.register.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const institution = document.getElementById('register-institution').value;
    const specialization = document.getElementById('register-specialization').value;
    
    try {
      const data = await api.register({ 
        name, 
        email, 
        password, 
        institution, 
        specialization 
      });
      
      state.token = data.token;
      state.isAuthenticated = true;
      
      // Obține informații utilizator
      await loadUserData();
      
      // Redirecționare către proiecte
      loadProjects();
      
      // Resetează formularul
      selectors.forms.register.reset();
      
      showNotification('Cont creat cu succes!');
    } catch (error) {
      console.error('Register error:', error);
    }
  });
  
  selectors.forms.project.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('project-title').value;
    const description = document.getElementById('project-description').value;
    const startDate = document.getElementById('project-start-date').value;
    const endDate = document.getElementById('project-end-date').value;
    const status = document.getElementById('project-status').value;
    const speciesInput = document.getElementById('project-species').value;
    
    // Procesează speciile
    const targetSpecies = [];
    if (speciesInput) {
      const speciesList = speciesInput.split(',').map(s => s.trim());
      speciesList.forEach(species => {
        // Verifică dacă conține și nume comun în paranteze
        const match = species.match(/(.+)\s*\((.+)\)/);
        if (match) {
          targetSpecies.push({
            scientificName: match[1].trim(),
            commonName: match[2].trim()
          });
        } else {
          targetSpecies.push({
            scientificName: species
          });
        }
      });
    }
    
    try {
      const projectData = {
        title,
        description,
        startDate,
        status,
        targetSpecies
      };
      
      if (endDate) {
        projectData.endDate = endDate;
      }
      
      await api.createProject(projectData);
      
      // Actualizează lista de proiecte și afișează-le
      await loadProjects();
      
      // Resetează formularul
      selectors.forms.project.reset();
      
      showNotification('Proiect creat cu succes!');
    } catch (error) {
      console.error('Create project error:', error);
    }
  });
  
  selectors.forms.observation.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const scientificName = document.getElementById('observation-species-scientific').value;
    const commonName = document.getElementById('observation-species-common').value;
    const latitude = parseFloat(document.getElementById('observation-latitude').value);
    const longitude = parseFloat(document.getElementById('observation-longitude').value);
    const observationDate = document.getElementById('observation-date').value;
    const count = parseInt(document.getElementById('observation-count').value);
    const notes = document.getElementById('observation-notes').value;
    
    try {
      const observationData = {
        projectId: state.currentProject._id,
        species: {
          scientificName,
          commonName
        },
        coordinates: [longitude, latitude], // GeoJSON folosește [longitude, latitude]
        observationDate,
        count,
        notes
      };
      
      await api.createObservation(observationData);
      
      // Reîncărcăm observațiile proiectului
      const observations = await api.getProjectObservations(state.currentProject._id);
      renderProjectObservations(observations);
      showSection('projectDetails');
      
      // Resetează formularul
      selectors.forms.observation.reset();
      
      showNotification('Observație creată cu succes!');
    } catch (error) {
      console.error('Create observation error:', error);
    }
  });
  
  // Butoane
  selectors.buttons.getStarted.addEventListener('click', () => {
    if (state.isAuthenticated) {
      loadProjects();
    } else {
      showSection('register');
    }
  });
  
  selectors.buttons.addProject.addEventListener('click', () => {
    showSection('projectForm');
  });
  
  selectors.buttons.cancelProject.addEventListener('click', () => {
    selectors.forms.project.reset();
    showSection('projects');
  });
  
  selectors.buttons.backToProjects.addEventListener('click', () => {
    state.currentProject = null;
    showSection('projects');
  });
  
  selectors.buttons.addObservation.addEventListener('click', () => {
    showSection('observationForm');
  });
  
  selectors.buttons.cancelObservation.addEventListener('click', () => {
    selectors.forms.observation.reset();
    showSection('projectDetails');
  });
  
  // Link-uri
  selectors.links.toRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('register');
  });
  
  selectors.links.toLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('login');
  });
  
  // Modal
  selectors.modal.close.addEventListener('click', () => {
    selectors.modal.notification.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === selectors.modal.notification) {
      selectors.modal.notification.style.display = 'none';
    }
  });
}

// Logică aplicație
async function loadUserData() {
  console.log(`👤 Loading user data...`);
  
  try {
    state.user = await api.getCurrentUser();
    console.log(`✅ User data loaded:`, state.user);
    updateNavigation();
  } catch (error) {
    console.error('Load user data error:', error);
    logout();
  }
}

async function loadProjects() {
  console.log(`📋 Loading projects...`);
  
  try {
    state.projects = await api.getProjects();
    console.log(`✅ Projects loaded:`, state.projects);
    renderProjects();
    showSection('projects');
  } catch (error) {
    console.error('Load projects error:', error);
  }
}

function logout() {
  console.log(`🚪 Logging out...`);
  
  state.token = null;
  state.isAuthenticated = false;
  state.user = null;
  state.projects = [];
  state.currentProject = null;
  
  updateNavigation();
  showSection('home');
  showNotification('V-ați deconectat cu succes!');
}

// Inițializare aplicație
async function init() {
  console.log(`🚀 Initializing application...`);
  
  setupEventListeners();
  
  // Inițializează cu utilizatorul deconectat
  state.isAuthenticated = false;
  state.token = null;
  updateNavigation();
  
  console.log(`✅ Application initialized`);
}

// Start aplicație
document.addEventListener('DOMContentLoaded', init);