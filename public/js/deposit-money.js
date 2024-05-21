async function updateBalance() {
  const name = document.getElementById('cardholder-name').value;
  const number = document.getElementById('card-number').value;
  const date = document.getElementById('exp-date').value;
  const cvv = document.getElementById('cvv').value;
  const amount = document.getElementById('deposit-amount').value;

  // Validate inputs
  if (!name || !number || !date || !cvv || !amount) {
    document.getElementById('message-container').innerHTML = '<p class="error">Please fill in all fields</p>';
    return;
  }

  const card = {
    name: name,
    number: Number(number),
    date: date,
    cvv: Number(cvv),
    amount: parseFloat(amount)
  };

  try {
    const response = await fetch('/deposit_money', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(card)
    });

    const result = await response.text();
    document.open();
    document.write(result);
    document.close();
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('message-container').innerHTML = '<p class="error">An unexpected error occurred. Please try again later.</p>';
  }
}
