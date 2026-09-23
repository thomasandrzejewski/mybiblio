import { signIn } from './supabase.js';

const form = document.querySelector('#auth-form');
const message = document.querySelector('#auth-message');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.querySelector('#email').value.trim();
    const password = document.querySelector('#password').value;
    const submitButton = form.querySelector('button[type="submit"]');

    message.textContent = '';
    submitButton.disabled = true;

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;

      // signInWithPassword has established the Supabase session. Always send
      // the user to the application home page after a successful login.
      window.location.replace('index.html');
    } catch (error) {
      console.error(error);
      message.textContent = error.message || 'Impossible de se connecter.';
    } finally {
      submitButton.disabled = false;
    }
  });
}
