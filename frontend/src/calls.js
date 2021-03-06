import { CSHandler } from 'react-central-state';
import axios from 'axios';

const handler = new CSHandler();

const getComic = () => {
  return axios.get('https://xkcd-imgs.herokuapp.com/')
  .then(response => {
    return {
      title: response.data.title,
      comic: response.data.url,
    };
  })
  .catch(error => {
    console.log(error);
    return null;
  });
}

const getDeadlines = () => {
  axios.get('/api/deadlines/')
  .then(response => {
    handler.setCentralState({
      projectDeadline: response.data.project_deadline,
      voteDeadline: response.data.vote_deadline,
    });
  }).catch(error => {
    handler.setCentralState({
      projectDeadline: null,
      voteDeadline: null,
    });
    console.log(error);
  })
}

const getProjects = () => {
  axios.get('/api/projects/')
  .then(response => {
    handler.setCentralState({
      projects: response.data.projects.sort((a, b) => a.id > b.id),
    });
  }).catch(error => {
    handler.setCentralState({
      projects: [],
    });
    console.log(error);
  })
}

const getUser = () => {
  if (localStorage.getItem('token')) {
    axios.get('/api/user/', {
      headers: {
        Authorization: localStorage.getItem('token'),
      },
    }).then(response => {
      handler.setCentralState({
        user: response.data.user,
      });
    }).catch(error => {
      handler.setCentralState({
        user: null,
      });
      console.log(error);
    })
  } else {
    handler.setCentralState({
      user: null,
    });
  }
}

const generateVerification = (zID, fullName, password) => {
  axios.post('/api/generate_verification/', {
    zid: zID,
    full_name: fullName,
    password: password,
  }).catch(error => {
    alert(error.response.data.message);
  });
}

const verification = (token) => {
  return axios.post('/api/use_verification/', {
    token: token,
  }).then(response => {
    localStorage.setItem('token', response.data.token)
    handler.setCentralState({
      user: response.data.user,
    });
    return true;
  }).catch(error => {
    alert(error.response.data.message);
    return false;
  });
}

const logIn = (zID, password) => {
  axios.post('/api/login/', {
    zid: zID,
    password: password,
  }).then(response => {
    localStorage.setItem('token', response.data.token);
    handler.setCentralState({
      user: response.data.user,
    });
  }).catch(error => {
    alert(error.response.data.message);
  })
}

const logOut = () => {
  axios.get('/api/logout/', {
    headers: {
      Authorization: localStorage.getItem('token'),
    },
  }).then(() => {
    localStorage.removeItem('token');
    handler.setCentralState({
      user: null,
    });
  }).catch(error => {
    alert(error.response.data.message);
  });
}

const changeFullName = (fullName) => {
  axios.post('/api/change_full_name/', {
    full_name: fullName,
  }, {
    headers: {
      Authorization: localStorage.getItem('token'),
    },
  }).then(() => {
    handler.setCentralState({
      user: {
        zID: handler.centralState.user.zID,
        fullName: fullName,
        votes: handler.centralState.user.votes,
        project: handler.centralState.user.project,
      },
    });
  }).catch(error => {
    alert(error.response.data.message);
  });
}

const changePassword = (password) => {
  axios.post('/api/change_password/', {
    password: password,
  }, {
    headers: {
      Authorization: localStorage.getItem('token'),
    },
  }).catch(error => {
    alert(error.response.data.message);
  });
}

const generateReset = (zID) => {
  axios.post('/api/generate_reset/', {
    zid: zID,
  }).catch(error => {
    alert(error.response.data.message);
  });
}

const reset = (token, password) => {
  return axios.post('/api/use_reset/', {
    token: token,
    password: password,
  }).then(response => {
      localStorage.setItem('token', response.data.token)
    handler.setCentralState({
      user: response.data.user,
    });
    return true;
  }).catch(error => {
    alert(error.response.data.message);
    return false;
  });
}

const vote = (project_id) => {
  axios.post('/api/vote/', {
    project_id: project_id,
  }, {
    headers: {
      Authorization: localStorage.getItem('token'),
    },
  }).then(() => {
    const project = handler.centralState.projects.filter(project => project.id === project_id)[0];
    project.votes++;
    handler.setCentralState({
      user: {
        zID: handler.centralState.user.zID,
        fullName: handler.centralState.user.fullName,
        votes: handler.centralState.user.votes.concat(project_id),
        project: handler.centralState.user.project,
      },
      projects: handler.centralState.projects.filter(project => project.id !== project_id).concat(project).sort((a, b) => a.id > b.id),
    });
  }).catch(error => {
    alert(error.response.data.message);
  });
}

const unvote = (project_id) => {
  axios.post('/api/unvote/', {
    project_id: project_id,
  }, {
    headers: {
      Authorization: localStorage.getItem('token'),
    },
  }).then(() => {
    const project = handler.centralState.projects.filter(project => project.id === project_id)[0];
    project.votes--;
    handler.setCentralState({
      user: {
        zID: handler.centralState.user.zID,
        fullName: handler.centralState.user.fullName,
        votes: handler.centralState.user.votes.filter(id => id !== project_id),
        project: handler.centralState.user.project,
      },
       projects: handler.centralState.projects.filter(project => project.id !== project_id).concat(project).sort((a, b) => a.id > b.id),
    });
  }).catch(error => {
    alert(error.response.data.message);
  });
}

const checkZID = (zID) => {
  return axios.post('/api/check_zid/', {
    zid: zID,
  }, {
    headers: {
      Authorization: localStorage.getItem('token'),
    },
  }).then(response => {
    return {
      zID: response.data.zID,
      fullName: response.data.fullName,
    };
  }).catch(error => {
    alert(error.response.data.message);
    return null;
  });
}

const submitProject = (title, summary, link, repo, first_year, postgraduate, team_zids) => {
  axios.post('/api/submit_project/', {
    title: title,
    summary: summary,
    link: link,
    repo: repo,
    first_year: first_year,
    postgraduate: postgraduate,
    team_zids: team_zids,
  }, {
    headers: {
      Authorization: localStorage.getItem('token'),
    },
  }).then(response => {
    handler.setCentralState({
      user: {
        zID: handler.centralState.user.zID,
        fullName: handler.centralState.user.zID,
        votes: handler.centralState.user.votes,
        project: response.data.project.id,
      },
      projects: handler.centralState.projects.concat(response.data.project).sort((a, b) => a.id > b.id),
    });
  }).catch(error => {
    alert(error.response.data.message);
  });
}

const editProject = (title, summary, link, repo, first_year, postgraduate, team_zids) => {
  const id = handler.centralState.user.project;
  axios.post('/api/edit_project/', {
    title: title,
    summary: summary,
    link: link,
    repo: repo,
    first_year: first_year,
    postgraduate: postgraduate,
    team_zids: team_zids,
  }, {
    headers: {
      Authorization: localStorage.getItem('token'),
    },
  }).then(response => {
    handler.setCentralState({
      projects: handler.centralState.projects.filter(project => project.id !== id).concat(response.data.project).sort((a, b) => a.id > b.id),
    });
  }).catch(error => {
    alert(error.response.data.message);
  });
}

const deleteProject = () => {
  const id = handler.centralState.user.project;
  axios.get('/api/delete_project/', {
    headers: {
      Authorization: localStorage.getItem('token'),
    },
  }).then(() => {
    handler.setCentralState({
      user: {
        zID: handler.centralState.user.zID,
        fullName: handler.centralState.user.zID,
        votes: handler.centralState.user.votes,
        project: null,
      },
      projects: handler.centralState.projects.filter(project => project.id !== id),
    });
  }).catch(error => {
    alert(error.response.data.message);
  });
}

export { getComic, getDeadlines, getProjects, getUser, generateVerification, verification, logIn, logOut, changeFullName, changePassword, generateReset, reset, vote, unvote, checkZID, submitProject, editProject, deleteProject };
