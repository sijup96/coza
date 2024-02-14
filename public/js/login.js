const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
	container.classList.add('right-panel-active');
	history.pushState({ panel: 'signup' }, null, '/register');
  });
  
  signInButton.addEventListener('click', () => {
	container.classList.remove('right-panel-active');
	history.pushState({ panel: 'signin' }, null, '/login');
  });
  
  // Handle back/forward navigation
  window.addEventListener('popstate', (event) => {
	const state = event.state;
	if (state) {
	  if (state.panel === 'signup') {
		container.classList.add('right-panel-active');
	  } else {
		container.classList.remove('right-panel-active');
	  }
	}
  });