async function withdrawMoney() {
  const amount = document.getElementById('amount').value;
  const iban = document.getElementById('card-number').value;
  const confirmation = document.getElementById('confirmation-checkbox').checked;

  // Validate inputs
  if (!amount || !iban || !confirmation) {
    document.getElementById('message-container').innerHTML = '<p class="error">Please fill in all fields and confirm the withdrawal</p>';
    return;
  }

  const withdrawalData = {
    amount: parseFloat(amount),
    iban: iban
  };

  try {
    const response = await fetch('/withdraw_money', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(withdrawalData)
    });

    if (response.ok) {
      const result = await response.text();
      document.open();
      document.write(result);
      document.close();
    } else {
      const errorData = await response.json();
      document.getElementById('message-container').innerHTML = `<p class="error">Withdrawal failed: ${errorData.message}</p>`;
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('message-container').innerHTML = '<p class="error">An unexpected error occurred. Please try again later.</p>';
  }
}
