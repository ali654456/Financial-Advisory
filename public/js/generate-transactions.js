document.getElementById('link-account-button').addEventListener('click', async function() {
  const form = document.getElementById('bank-form');

  // Check if the form is valid
  if (!form.checkValidity()) {
    alert('Please fill in all the required fields.');
    return;
  }

  const formData = new FormData(form);
  const data = {
    cardHolderName: formData.get('cardHolderName'),
    cardNumber: formData.get('cardNumber'),
    cardDate: formData.get('cardDate'),
    cardCvv: formData.get('cardCvv'),
    iban: formData.get('iban'),
    bankAccount: formData.get('bankAccount')
  };

  try {
    const response = await fetch('/link_account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

  } catch (error) {
    console.error('Error linking account:', error);
    alert('An error occurred while linking the account.');
  }
});
