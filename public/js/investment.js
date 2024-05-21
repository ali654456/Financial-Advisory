document.querySelectorAll('.btn1').forEach(button => {
  button.addEventListener('click', () => {
    const plan = button.closest('.plan');
    const investmentInput = plan.querySelector('.investment-input');
    const investButton = plan.querySelector('.invest-btn');
    const riskLevel = button.getAttribute('data-risk');

    if (button.innerText === 'GET STARTED') {
      // Check if any other plan is active
      const activePlan = document.querySelector('.btn1.active');
      if (activePlan) {
        alert('Only one investment can be active at a time.');
        return;
      }

      investmentInput.style.display = 'block';
      button.classList.add('active');
      button.innerText = 'STOP INVESTMENT';
    } else {
      stopInvestment(riskLevel, plan, button);
    }
  });
});

document.querySelectorAll('.invest-btn').forEach(button => {
  button.addEventListener('click', async () => {
    const riskLevel = button.getAttribute('data-risk');
    const amount = button.previousElementSibling.value;
    const plan = button.closest('.plan');
    const startButton = plan.querySelector('.btn1.active');

    if (!amount) {
      alert('Please enter an investment amount.');
      return;
    }

    try {
      const response = await fetch('/add-investment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ riskLevel, amount })
      });

      const result = await response.json();
      const messageContainer = document.getElementById('message-container');

      if (response.ok) {
        messageContainer.innerHTML = `<p class="success">${result.message}</p>`;
        plan.querySelector('.investment-input').style.display = 'none';
        startButton.innerText = 'STOP INVESTMENT';
        startButton.classList.add('active');
      } else {
        messageContainer.innerHTML = `<p class="error">${result.error}</p>`;
      }
    } catch (error) {
      console.error('Error adding investment:', error);
      alert('An error occurred while adding the investment.');
    }
  });
});

async function stopInvestment(riskLevel, plan, button) {
  try {
    const response = await fetch('/stop-investment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ riskLevel })
    });

    const result = await response.json();
    const messageContainer = document.getElementById('message-container');

    if (response.ok) {
      messageContainer.innerHTML = `<p class="success">${result.message}</p>`;
      plan.querySelector('.investment-input').style.display = 'none';
      button.innerText = 'GET STARTED';
      button.classList.remove('active');
    } else {
      messageContainer.innerHTML = `<p class="error">${result.error}</p>`;
    }
  } catch (error) {
    console.error('Error stopping investment:', error);
    alert('An error occurred while stopping the investment.');
  }
}
