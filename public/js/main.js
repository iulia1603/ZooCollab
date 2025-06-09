// State global al aplicației
const state = {
  isAuthenticated: false,
  token: null,
  user: null,
  projects: [],
  publicProjects: [],
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
    publicProjects: document.getElementById('public-projects-section'),
    projectForm: document.getElementById('project-form-section'),
    projectDetails: document.getElementById('project-details-section'),
    observationForm: document.getElementById('observation-form-section'),
    profile: document.getElementById('profile-section')
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
    viewAllPublic: document.getElementById('view-all-public-btn'),
    backToHome: document.getElementById('back-to-home-btn'),
    addProject: document.getElementById('add-project-btn'),
    cancelProject: document.getElementById('cancel-project-btn'),
    backToProjects: document.getElementById('back-to-projects-btn'),
    addObservation: document.getElementById('add-observation-btn'),
    cancelObservation: document.getElementById('cancel-observation-btn')
  },
  containers: {
    projectsList: document.getElementById('projects-list'),
    publicProjectsList: document.getElementById('public-projects-list'),
    publicProjectsPreview: document.getElementById('public-projects-preview'),
    projectDetails: document.getElementById('project-details'),
    projectObservations: document.getElementById('project-observations')
  },
  messages: {
    noProjects: document.getElementById('no-projects-message'),
    noPublicProjects: document.getElementById('no-public-projects-message'),
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
  
  async request(endpoint, method = 'GET', data = null, requireAuth = true) {
    console.log(`🔄 API Request: ${method} ${endpoint}`, { data, token: state.token ? 'exists' : 'none', requireAuth });
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Adaugă token doar dacă este necesar și disponibil
    if (requireAuth && state.token) {
      options.headers['x-auth-token'] = state.token;
    } else if (!requireAuth && state.token) {
      // Pentru cererile opționale, adaugă token dacă există
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

  async getPublicProjects() {
    return this.request('/projects/public', 'GET', null, false);
  },
  
  async createProject(projectData) {
    return this.request('/projects', 'POST', projectData);
  },
  
  async getProject(id) {
    return this.request(`/projects/${id}`, 'GET', null, false);
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
    return this.request(`/observations/project/${projectId}`, 'GET', null, false);
  },

  async editObservation(observationId, observationData) {
    return this.request(`/observations/${observationId}`, 'PUT', observationData);
  },

  async deleteObservation(observationId) {
    return this.request(`/observations/${observationId}`, 'DELETE');
  },

  async getObservationPermissions(observationId) {
    return this.request(`/observations/${observationId}/permissions`, 'GET', null, false);
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
    const visibilityClass = `visibility-${project.visibility}`;
    const visibilityText = project.visibility === 'public' ? 'Public' : 'Privat';
    
    projectCard.innerHTML = `
      <h3>${project.title}</h3>
      <div class="project-badges">
        <span class="status ${statusClass}">${project.status}</span>
        <span class="visibility ${visibilityClass}">${visibilityText}</span>
      </div>
      <p>${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
      <p><strong>Creator:</strong> ${project.creator.name}</p>
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

function renderPublicProjects(isPreview = false) {
  const projects = isPreview ? state.publicProjects.slice(0, 3) : state.publicProjects;
  const container = isPreview ? selectors.containers.publicProjectsPreview : selectors.containers.publicProjectsList;
  const noProjectsMessage = isPreview ? null : selectors.messages.noPublicProjects;
  
  console.log(`🌍 Rendering ${projects.length} public projects ${isPreview ? '(preview)' : ''}`);
  
  // Curăță containerul
  container.innerHTML = '';
  
  if (projects.length === 0) {
    if (noProjectsMessage) {
      noProjectsMessage.style.display = 'block';
    }
    return;
  }
  
  if (noProjectsMessage) {
    noProjectsMessage.style.display = 'none';
  }
  
  // Randează fiecare proiect public
  projects.forEach(project => {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    
    const statusClass = `status-${project.status}`;
    
    projectCard.innerHTML = `
      <h3>${project.title}</h3>
      <div class="project-badges">
        <span class="status ${statusClass}">${project.status}</span>
        <span class="visibility visibility-public">Public</span>
      </div>
      <p>${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
      <p><strong>Creator:</strong> ${project.creator.name}</p>
      <div class="project-actions">
        <button class="btn btn-sm view-project" data-id="${project._id}">Vizualizare</button>
      </div>
    `;
    
    container.appendChild(projectCard);
    
    // Adaugă event listener pentru butonul de vizualizare
    projectCard.querySelector('.view-project').addEventListener('click', () => {
      console.log(`🎯 User clicked to view public project: ${project._id}`);
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
      visibility: state.currentProject.visibility,
      members: state.currentProject.members.map(m => ({
        userId: m.user._id,
        userName: m.user.name,
        role: m.role
      }))
    });
    
    renderProjectDetails();
    
    // Obține observațiile pentru acest proiect
    console.log(`📊 Fetching observations for project...`);
    try {
      const observations = await api.getProjectObservations(projectId);
      console.log(`📊 Observations fetched:`, observations);
      renderProjectObservations(observations);
    } catch (error) {
      console.error('Error fetching observations:', error);
      // Continuă să afișeze proiectul chiar dacă observațiile nu pot fi încărcate
      renderProjectObservations([]);
    }
    
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
  const visibilityText = project.visibility === 'public' ? 'Public' : 'Privat';
  const visibilityClass = `visibility-${project.visibility}`;
  
  // Verifică dacă utilizatorul curent este creatorul
  const isCreator = state.user && project.creator._id === state.user._id;
  console.log(`👑 Is creator check:`, { isCreator, userId: state.user?._id, creatorId: project.creator._id });
  
  // Verifică dacă utilizatorul are permisiunea să adauge observații
  const canAddObservations = state.user && (isCreator || project.members.some(m => m.user._id === state.user._id));
  
  container.innerHTML = `
    <h2>${project.title}</h2>
    <div class="metadata">
      <div>
        <strong>Status:</strong> 
        <span class="status status-${project.status}">${project.status}</span>
      </div>
      <div>
        <strong>Vizibilitate:</strong> 
        <span class="visibility ${visibilityClass}">${visibilityText}</span>
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
  
  // Actualizează butonul de adăugare observații
  const addObsBtn = selectors.buttons.addObservation;
  if (addObsBtn) {
    if (canAddObservations) {
      addObsBtn.style.display = 'inline-block';
    } else {
      addObsBtn.style.display = 'none';
    }
  }
  
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
    
    // Obține permisiunile pentru această observație doar dacă utilizatorul este autentificat
    let permissions = { canEdit: false, canDelete: false, isOwner: false, userRole: null };
    
    if (state.user) {
      try {
        permissions = await api.getObservationPermissions(observation._id);
        console.log(`🔒 Permissions for observation ${observation._id}:`, permissions);
      } catch (error) {
        console.error(`❌ Error getting permissions for observation ${observation._id}:`, error);
      }
    }
    
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
    loadPublicProjectsPreview();
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
    // Afișează profilul în loc de pagina de profil
    showProfile();
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
  
  // Butoane pentru proiecte publice
  if (selectors.buttons.viewAllPublic) {
    selectors.buttons.viewAllPublic.addEventListener('click', () => {
      loadAllPublicProjects();
    });
  }
  
  if (selectors.buttons.backToHome) {
    selectors.buttons.backToHome.addEventListener('click', () => {
      showSection('home');
      loadPublicProjectsPreview();
    });
  }
  
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
    const visibility = document.getElementById('project-visibility').value;
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
        visibility,
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

  // Event listener pentru navigarea la profil
  selectors.nav.login.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.isAuthenticated) {
      // Afișează profilul
      showProfile();
    } else {
      showSection('login');
    }
  });
  
  // Event listener pentru butonul de întoarcere din profil
  if (profileSelectors.backToHomeFromProfile) {
    profileSelectors.backToHomeFromProfile.addEventListener('click', () => {
      showSection('home');
      loadPublicProjectsPreview();
    });
  }

  const backToHomeFromProfile = document.getElementById('back-to-home-from-profile-btn');
if (backToHomeFromProfile) {
  backToHomeFromProfile.addEventListener('click', () => {
    showSection('home');
    loadPublicProjectsPreview();
  });
}
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

async function loadPublicProjectsPreview() {
  console.log(`🌍 Loading public projects preview...`);
  
  try {
    state.publicProjects = await api.getPublicProjects();
    console.log(`✅ Public projects loaded:`, state.publicProjects);
    renderPublicProjects(true);
  } catch (error) {
    console.error('Load public projects preview error:', error);
  }
}

async function loadAllPublicProjects() {
  console.log(`🌍 Loading all public projects...`);
  
  try {
    state.publicProjects = await api.getPublicProjects();
    console.log(`✅ All public projects loaded:`, state.publicProjects);
    renderPublicProjects(false);
    showSection('publicProjects');
  } catch (error) {
    console.error('Load all public projects error:', error);
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
  loadPublicProjectsPreview();
  showNotification('V-ați deconectat cu succes!');
}

// Variabile pentru profile
let userProjects = {
  created: [],
  member: []
};

// Selectori pentru profile
const profileSelectors = {
  section: document.getElementById('profile-section'),
  userDetails: document.querySelector('.user-details'),
  createdProjectsList: document.getElementById('created-projects-list'),
  memberProjectsList: document.getElementById('member-projects-list'),
  noCreatedMessage: document.getElementById('no-created-projects-message'),
  noMemberMessage: document.getElementById('no-member-projects-message'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  backToHomeFromProfile: document.getElementById('back-to-home-from-profile-btn'),
  // Contori statistici
  totalProjectsCount: document.getElementById('total-projects-count'),
  createdProjectsCount: document.getElementById('created-projects-count'),
  memberProjectsCount: document.getElementById('member-projects-count'),
  userObservationsCount: document.getElementById('user-observations-count')
};

// Funcție pentru afișarea profilului
async function showProfile() {
  console.log('🔍 Loading user profile...');
  
  if (!state.isAuthenticated || !state.user) {
    showNotification('Trebuie să fiți autentificat pentru a accesa profilul');
    showSection('login');
    return;
  }
  
  try {
    // Încarcă datele profilului
    await loadProfileData();
    showSection('profile');
  } catch (error) {
    console.error('Error loading profile:', error);
    showNotification('Eroare la încărcarea profilului');
  }
}

// Funcție pentru încărcarea datelor profilului
async function loadProfileData() {
  console.log('📊 Loading profile data...');
  
  try {
    // Afișează informațiile utilizatorului
    renderUserInfo();
    
    // Încarcă proiectele
    await loadUserProjects();
    
    // Încarcă statisticile
    await loadUserStatistics();
    
    // Setează tab-urile
    setupProfileTabs();
    
  } catch (error) {
    console.error('Error loading profile data:', error);
    throw error;
  }
}

// Funcție pentru afișarea informațiilor utilizatorului
function renderUserInfo() {
  console.log('👤 Rendering user info...');
  
  const user = state.user;
  const joinDate = new Date(user.createdAt).toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  profileSelectors.userDetails.innerHTML = `
    <div class="user-detail-item">
      <strong>Nume complet</strong>
      <span>${user.name}</span>
    </div>
    <div class="user-detail-item">
      <strong>Email</strong>
      <span>${user.email}</span>
    </div>
    <div class="user-detail-item">
      <strong>Instituție</strong>
      <span>${user.institution}</span>
    </div>
    <div class="user-detail-item">
      <strong>Specializare</strong>
      <span>${user.specialization || 'Nu este specificată'}</span>
    </div>
    <div class="user-detail-item">
      <strong>Rol</strong>
      <span>${user.role}</span>
    </div>
    <div class="user-detail-item">
      <strong>Membru din</strong>
      <span>${joinDate}</span>
    </div>
  `;
}

// Funcție pentru încărcarea proiectelor utilizatorului
async function loadUserProjects() {
  console.log('📋 Loading user projects...');
  
  try {
    // Obține toate proiectele accesibile utilizatorului
    const allProjects = await api.getProjects();
    
    // Separă proiectele create de utilizator de cele în care este membru
    userProjects.created = allProjects.filter(project => 
      project.creator._id === state.user._id
    );
    
    userProjects.member = allProjects.filter(project => 
      project.creator._id !== state.user._id &&
      project.members.some(member => member.user._id === state.user._id)
    );
    
    console.log(`📊 Found ${userProjects.created.length} created projects and ${userProjects.member.length} member projects`);
    
    // Randează proiectele
    renderUserProjects();
    
  } catch (error) {
    console.error('Error loading user projects:', error);
    throw error;
  }
}

// Funcție pentru randarea proiectelor utilizatorului
function renderUserProjects() {
  console.log('🎨 Rendering user projects...');
  
  // Randează proiectele create
  renderProjectList(userProjects.created, profileSelectors.createdProjectsList, profileSelectors.noCreatedMessage, 'created');
  
  // Randează proiectele în care este membru
  renderProjectList(userProjects.member, profileSelectors.memberProjectsList, profileSelectors.noMemberMessage, 'member');
}

// Funcție auxiliară pentru randarea unei liste de proiecte
function renderProjectList(projects, container, noDataMessage, type) {
  // Curăță containerul
  container.innerHTML = '';
  
  if (projects.length === 0) {
    noDataMessage.style.display = 'block';
    return;
  }
  
  noDataMessage.style.display = 'none';
  
  projects.forEach(project => {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    
    const statusClass = `status-${project.status}`;
    const visibilityClass = `visibility-${project.visibility}`;
    const visibilityText = project.visibility === 'public' ? 'Public' : 'Privat';
    
    // Pentru proiectele în care utilizatorul este membru, afișează și rolul
    let roleInfo = '';
    if (type === 'member') {
      const member = project.members.find(m => m.user._id === state.user._id);
      if (member) {
        roleInfo = `<span class="role-badge role-${member.role}">${member.role}</span>`;
      }
    }
    
    projectCard.innerHTML = `
      <h3>${project.title}</h3>
      <div class="project-badges">
        <span class="status ${statusClass}">${project.status}</span>
        <span class="visibility ${visibilityClass}">${visibilityText}</span>
        ${roleInfo}
      </div>
      <p>${project.description.substring(0, 150)}${project.description.length > 150 ? '...' : ''}</p>
      <p><strong>Creator:</strong> ${project.creator.name}</p>
      ${project.members.length > 0 ? `<p><strong>Membri:</strong> ${project.members.length}</p>` : ''}
      <div class="project-actions">
        <button class="btn btn-sm view-project" data-id="${project._id}">Vizualizare</button>
      </div>
    `;
    
    container.appendChild(projectCard);
    
    // Adaugă event listener pentru butonul de vizualizare
    projectCard.querySelector('.view-project').addEventListener('click', () => {
      viewProject(project._id);
    });
  });
}

// Funcție pentru încărcarea statisticilor utilizatorului
async function loadUserStatistics() {
  console.log('📈 Loading user statistics...');
  
  try {
    // Calculează statisticile proiectelor
    const totalProjects = userProjects.created.length + userProjects.member.length;
    const createdProjects = userProjects.created.length;
    const memberProjects = userProjects.member.length;
    
    // Pentru observații, trebuie să facem o cerere separată
    let userObservations = 0;
    try {
      // Încarcă observațiile pentru toate proiectele utilizatorului
      const allProjectIds = [...userProjects.created, ...userProjects.member].map(p => p._id);
      let totalObservations = 0;
      
      for (const projectId of allProjectIds) {
        try {
          const observations = await api.getProjectObservations(projectId);
          // Numără doar observațiile făcute de utilizatorul curent
          const userObsInProject = observations.filter(obs => obs.observer._id === state.user._id);
          totalObservations += userObsInProject.length;
        } catch (error) {
          console.warn(`Could not load observations for project ${projectId}`);
        }
      }
      
      userObservations = totalObservations;
    } catch (error) {
      console.warn('Could not load user observations count:', error);
    }
    
    // Actualizează contoarele
    profileSelectors.totalProjectsCount.textContent = totalProjects;
    profileSelectors.createdProjectsCount.textContent = createdProjects;
    profileSelectors.memberProjectsCount.textContent = memberProjects;
    profileSelectors.userObservationsCount.textContent = userObservations;
    
    console.log(`📊 Statistics: ${totalProjects} total projects, ${userObservations} observations`);
    
  } catch (error) {
    console.error('Error loading user statistics:', error);
    // Setează valorile la 0 în caz de eroare
    profileSelectors.totalProjectsCount.textContent = '0';
    profileSelectors.createdProjectsCount.textContent = '0';
    profileSelectors.memberProjectsCount.textContent = '0';
    profileSelectors.userObservationsCount.textContent = '0';
  }
}

// Funcție pentru configurarea tab-urilor profilului
function setupProfileTabs() {
  console.log('🔧 Setting up profile tabs...');
  
  profileSelectors.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Elimină clasa active de la toate tab-urile
      profileSelectors.tabBtns.forEach(b => b.classList.remove('active'));
      profileSelectors.tabContents.forEach(c => c.classList.remove('active'));
      
      // Adaugă clasa active la tab-ul curent
      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}


// Inițializare aplicație
async function init() {
  console.log(`🚀 Initializing application...`);
  
  setupEventListeners();
  
  // Inițializează cu utilizatorul deconectat
  state.isAuthenticated = false;
  state.token = null;
  updateNavigation();
  
  // Încarcă proiectele publice pentru preview
  await loadPublicProjectsPreview();
  
  console.log(`✅ Application initialized`);
}

// Start aplicație
document.addEventListener('DOMContentLoaded', init);


// Variabile pentru filtrare
let filteredProjects = [];
let currentFilters = {
  search: '',
  status: '',
  visibility: '',
  creator: '',
  species: ''
};
let currentSort = 'date-desc';

// Selectori pentru filtrare
const filterSelectors = {
  container: document.querySelector('.projects-filters'),
  searchInput: document.getElementById('search-projects'),
  statusSelect: document.getElementById('filter-status'),
  visibilitySelect: document.getElementById('filter-visibility'),
  creatorSelect: document.getElementById('filter-creator'),
  speciesInput: document.getElementById('filter-species'),
  clearBtn: document.getElementById('clear-filters'),
  applyBtn: document.getElementById('apply-filters'),
  resultsCount: document.getElementById('results-count'),
  sortSelect: document.getElementById('sort-projects')
};

// Inițializează sistemul de filtrare
function initializeFilters() {
  console.log('🔧 Initializing project filters...');
  
  // Populează dropdown-ul cu creatori
  populateCreatorsFilter();
  
  // Adaugă event listeners
  setupFilterEventListeners();
  
  // Setează filtrele inițiale
  filteredProjects = [...state.projects];
  updateResultsCount();
  
  // Adaugă funcționalitate de collapse pentru filtre
  setupFilterCollapse();
}

// Populează dropdown-ul cu creatori
function populateCreatorsFilter() {
  if (!filterSelectors.creatorSelect) return;
  
  const creators = new Set();
  state.projects.forEach(project => {
    creators.add(JSON.stringify({
      id: project.creator._id,
      name: project.creator.name
    }));
  });
  
  // Curăță opțiunile existente (păstrează primele două)
  const existingOptions = filterSelectors.creatorSelect.querySelectorAll('option');
  for (let i = 2; i < existingOptions.length; i++) {
    existingOptions[i].remove();
  }
  
  // Adaugă creatorii
  creators.forEach(creatorStr => {
    const creator = JSON.parse(creatorStr);
    const option = document.createElement('option');
    option.value = creator.id;
    option.textContent = creator.name;
    filterSelectors.creatorSelect.appendChild(option);
  });
}

// Configurează event listeners pentru filtre
function setupFilterEventListeners() {
  console.log('🎧 Setting up filter event listeners...');
  
  // Căutare în timp real
  if (filterSelectors.searchInput) {
    filterSelectors.searchInput.addEventListener('input', debounce(applyFilters, 300));
  }
  
  // Filtre dropdown
  [filterSelectors.statusSelect, filterSelectors.visibilitySelect, filterSelectors.creatorSelect].forEach(select => {
    if (select) {
      select.addEventListener('change', applyFilters);
    }
  });
  
  // Căutare specii
  if (filterSelectors.speciesInput) {
    filterSelectors.speciesInput.addEventListener('input', debounce(applyFilters, 300));
  }
  
  // Butoane
  if (filterSelectors.clearBtn) {
    filterSelectors.clearBtn.addEventListener('click', clearFilters);
  }
  
  if (filterSelectors.applyBtn) {
    filterSelectors.applyBtn.addEventListener('click', applyFilters);
  }
  
  // Sortare
  if (filterSelectors.sortSelect) {
    filterSelectors.sortSelect.addEventListener('change', applySorting);
  }
}

// Configurează funcționalitatea de collapse pentru filtre
function setupFilterCollapse() {
  const filtersHeader = filterSelectors.container?.querySelector('h3');
  if (filtersHeader) {
    filtersHeader.addEventListener('click', () => {
      filterSelectors.container.classList.toggle('collapsed');
    });
  }
}

// Aplică toate filtrele
function applyFilters() {
  console.log('🔍 Applying filters...');
  
  // Colectează valorile filtrelor
  currentFilters = {
    search: filterSelectors.searchInput?.value.toLowerCase() || '',
    status: filterSelectors.statusSelect?.value || '',
    visibility: filterSelectors.visibilitySelect?.value || '',
    creator: filterSelectors.creatorSelect?.value || '',
    species: filterSelectors.speciesInput?.value.toLowerCase() || ''
  };
  
  // Filtrează proiectele
  filteredProjects = state.projects.filter(project => {
    return matchesSearchFilter(project) &&
           matchesStatusFilter(project) &&
           matchesVisibilityFilter(project) &&
           matchesCreatorFilter(project) &&
           matchesSpeciesFilter(project);
  });
  
  // Aplică sortarea
  applySorting();
  
  // Actualizează UI
  renderFilteredProjects();
  updateResultsCount();
  
  // Feedback vizual
  if (filterSelectors.resultsCount) {
    filterSelectors.resultsCount.parentElement.classList.add('updated');
    setTimeout(() => {
      filterSelectors.resultsCount.parentElement.classList.remove('updated');
    }, 500);
  }
}

// Funcții de filtrare individuale
function matchesSearchFilter(project) {
  if (!currentFilters.search) return true;
  
  const searchTerm = currentFilters.search;
  return project.title.toLowerCase().includes(searchTerm) ||
         project.description.toLowerCase().includes(searchTerm) ||
         project.creator.name.toLowerCase().includes(searchTerm);
}

function matchesStatusFilter(project) {
  return !currentFilters.status || project.status === currentFilters.status;
}

function matchesVisibilityFilter(project) {
  return !currentFilters.visibility || project.visibility === currentFilters.visibility;
}

function matchesCreatorFilter(project) {
  if (!currentFilters.creator) return true;
  
  if (currentFilters.creator === 'mine') {
    return state.user && project.creator._id === state.user._id;
  }
  
  return project.creator._id === currentFilters.creator;
}

function matchesSpeciesFilter(project) {
  if (!currentFilters.species) return true;
  
  const searchTerm = currentFilters.species;
  return project.targetSpecies && project.targetSpecies.some(species => 
    species.scientificName.toLowerCase().includes(searchTerm) ||
    (species.commonName && species.commonName.toLowerCase().includes(searchTerm))
  );
}

// Aplică sortarea
function applySorting() {
  const sortValue = filterSelectors.sortSelect?.value || currentSort;
  currentSort = sortValue;
  
  filteredProjects.sort((a, b) => {
    switch (sortValue) {
      case 'date-desc':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'date-asc':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      case 'status':
        const statusOrder = { 'activ': 0, 'planificat': 1, 'suspendat': 2, 'finalizat': 3 };
        return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
      default:
        return 0;
    }
  });
}

// Randează proiectele filtrate
function renderFilteredProjects() {
  console.log(`🎨 Rendering ${filteredProjects.length} filtered projects`);
  
  const container = selectors.containers.projectsList;
  const noProjectsMessage = selectors.messages.noProjects;
  
  // Curăță containerul
  container.innerHTML = '';
  
  if (filteredProjects.length === 0) {
    // Afișează mesaj personalizat pentru filtrare
    container.innerHTML = `
      <div class="no-results-message">
        <h3>Nu au fost găsite proiecte</h3>
        <p>Încearcă să modifici filtrele pentru a găsi proiecte relevante.</p>
        <button class="btn btn-secondary" onclick="clearFilters()">Resetează toate filtrele</button>
      </div>
    `;
    return;
  }
  
  if (noProjectsMessage) {
    noProjectsMessage.style.display = 'none';
  }
  
  // Randează proiectele filtrate
  filteredProjects.forEach(project => {
    const projectCard = createProjectCard(project);
    container.appendChild(projectCard);
  });
}

// Creează un card de proiect cu highlight pentru căutare
function createProjectCard(project) {
  const projectCard = document.createElement('div');
  projectCard.className = 'project-card';
  
  const statusClass = `status-${project.status}`;
  const visibilityClass = `visibility-${project.visibility}`;
  const visibilityText = project.visibility === 'public' ? 'Public' : 'Privat';
  
  // Aplică highlight pentru termenii căutați
  let title = project.title;
  let description = project.description;
  
  if (currentFilters.search) {
    const regex = new RegExp(`(${escapeRegex(currentFilters.search)})`, 'gi');
    title = title.replace(regex, '<span class="search-highlight">$1</span>');
    description = description.replace(regex, '<span class="search-highlight">$1</span>');
  }
  
  projectCard.innerHTML = `
    <h3>${title}</h3>
    <div class="project-badges">
      <span class="status ${statusClass}">${project.status}</span>
      <span class="visibility ${visibilityClass}">${visibilityText}</span>
    </div>
    <p>${description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
    <p><strong>Creator:</strong> ${project.creator.name}</p>
    ${project.targetSpecies && project.targetSpecies.length > 0 ? 
      `<p><strong>Specii țintă:</strong> ${project.targetSpecies.length} specii</p>` : ''}
    <div class="project-actions">
      <button class="btn btn-sm view-project" data-id="${project._id}">Vizualizare</button>
    </div>
  `;
  
  // Adaugă event listener pentru vizualizare
  projectCard.querySelector('.view-project').addEventListener('click', () => {
    viewProject(project._id);
  });
  
  return projectCard;
}

// Curăță toate filtrele
function clearFilters() {
  console.log('🧹 Clearing all filters...');
  
  // Resetează controalele UI
  if (filterSelectors.searchInput) filterSelectors.searchInput.value = '';
  if (filterSelectors.statusSelect) filterSelectors.statusSelect.value = '';
  if (filterSelectors.visibilitySelect) filterSelectors.visibilitySelect.value = '';
  if (filterSelectors.creatorSelect) filterSelectors.creatorSelect.value = '';
  if (filterSelectors.speciesInput) filterSelectors.speciesInput.value = '';
  if (filterSelectors.sortSelect) filterSelectors.sortSelect.value = 'date-desc';
  
  // Resetează filtrele
  currentFilters = {
    search: '',
    status: '',
    visibility: '',
    creator: '',
    species: ''
  };
  currentSort = 'date-desc';
  
  // Aplică filtrele goale (afișează toate proiectele)
  applyFilters();
}

// Actualizează contorul de rezultate
function updateResultsCount() {
  if (filterSelectors.resultsCount) {
    const count = filteredProjects.length;
    const total = state.projects.length;
    
    if (count === total) {
      filterSelectors.resultsCount.textContent = `${count} proiecte`;
    } else {
      filterSelectors.resultsCount.textContent = `${count} din ${total} proiecte`;
    }
  }
}

// Funcție debounce pentru căutare
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Escape regex pentru căutare sigură
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Actualizează funcția renderProjects existentă pentru a include filtrarea
function renderProjects() {
  console.log(`🏗️ Rendering ${state.projects.length} projects`);
  
  // Inițializează filtrele după ce proiectele sunt încărcate
  initializeFilters();
  
  // Randează proiectele filtrate (inițial toate)
  renderFilteredProjects();
}