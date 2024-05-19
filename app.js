// Import dependencies
require('dotenv').config();
const { OpenAI } = require('openai');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const User = require('./models/User');
const Card = require('./models/Card');
const Transaction = require('./models/Transaction');
const Investment = require('./models/Investment');
const { sendEmail } = require('./public/js/email-service');
const flash = require('connect-flash');

// Initialize Express app
const app = express();

// Set the view engine to ejs
app.set('view engine', 'ejs');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));

// Session setup
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Use 'secure: true' if using HTTPS
}));

// Flash messages
app.use(flash());

// Passport configuration
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Incorrect Username or Password' });
      }
      if (password !== user.password) {
        return done(null, false, { message: 'Incorrect Username or Password' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Routes //

// Redirect login page
app.get('/', (req, res) => {
  res.redirect('/login-page');
});

// Render login page
app.get('/login-page', (req, res) => {
  res.render('login-page', { message: req.flash('error') });
});

// Render signup page
app.get('/signup-page', (req, res) => {
  res.render('signup-page', { message: '', error: '' });
});

// Render forget password page
app.get('/forget-password-page', (req, res) => {
  res.render('forget-password-page', { message: '', error: '' });
});

// Render homepage page
app.get('/home-page', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  res.render('home-page', { message: '', error: '', user: req.user, card: req.user.funds});
});

// Render deposit page
app.get('/deposit-page', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  res.render('deposit-page', { message: '', error: '' });
});

// Render withdraw page
app.get('/withdraw-page', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  res.render('withdraw-page', { message: '', error: '' });
});

// Render bank account link page
app.get('/link-account-page', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  res.render('link-account-page', { message: '', error: '' });
});

// Render Investo-AI page
app.get('/Investo-ai-page', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  res.render('Investo-ai-page', { message: '', error: '' });
});

// Render investment options page
app.get('/my-transactions-page', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  try {
    const transactions = await Transaction.find();

    // Log the fetched transactions for debugging purposes
    console.log('Fetched transactions:', transactions);

    if (!Array.isArray(transactions)) {
      throw new Error('Transactions is not an array');
    }

    res.render('my-transactions-page', { message: '', error: '', transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);

    res.render('my-transactions-page', { message: '', error: 'Failed to fetch transactions', transactions: [] });
  }
});

// Render investment options page
app.get('/options-page', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  res.render('options-page', { message: '', error: '' });
});

// Handles //

// Handle login
app.post('/login', passport.authenticate('local', {
  successRedirect: '/home-page',
  failureRedirect: '/login-page',
  failureFlash: true
}));

// Handle signup
app.post('/submit-signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username: username }, { email: email }] });

    if (existingUser) {
      return res.render('signup-page', { message: '', error: 'Username or email already exists' });
    }

    const newUser = new User({ username: username, email: email, password: password, cards: [], transactions: [] });

    await newUser.save();

    res.render('signup-page', { message: 'User added successfully', error: '' });
  } catch (error) {
    console.log(`Could not add user: ${error}`);
    res.render('signup-page', { message: '', error: 'Could not add user, please try again later' });
  }
});

// Handle forget password
app.post('/submit-forget-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).render('forget-password-page', { message: 'Invalid email address', error: '' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).render('forget-password-page', { message: '', error: 'User not found' });
    }

    const emailText = `Hey ${user.username},\n\nYour password is: ${user.password}\n\nPlease consider changing it once you're logged in.`;

    await sendEmail(user.email, 'Your Password Recovery', emailText);

    res.render('forget-password-page', { message: 'Password is sent to your email', error: '' });

    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error in forget password:', error);
    res.status(500).render('forget-password-page', { message: '', error: 'Internal server error' });
  }
});

// Handle AI
app.post('/ask-ai', async (req, res) => {
  const { ask } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: ask }],
      model: "gpt-4",
    });

    res.json({ message: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error during AI chat:', error);
    res.status(500).json({ message: 'Sorry, something went wrong.' });
  }
});

// Handle account linking
app.post('/link_account', async (req, res) => {
  const { cardHolderName, cardNumber, cardDate, cardCvv, iban, bankAccount } = req.body;

  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send('User not authenticated');
    }

    if (!cardHolderName || !cardNumber || !cardDate || !cardCvv || !bankAccount) {
      return res.render('link-account-page', { message: '', error: 'All fields are required except IBAN' });
    }

    let user = req.user;

    const newCard = new Card({
      name: cardHolderName,
      number: cardNumber,
      date: cardDate,
      cvv: cardCvv,
      iban: iban,
      bank: bankAccount
    });

    user.card = newCard;

    await user.save();

    res.render('link-account-page', { message: 'Card has been linked to your account', error: '' });
  } catch (error) {
    res.render('link-account-page', { message: '', error: 'Could not link card to your account, try again later' });
    console.log(error);
  }
});

// Handle money deposit
app.post('/deposit_money', (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login-page');
}, async (req, res) => {
  const { name, number, date, cvv, amount } = req.body;
  const userId = req.user._id;

  try {
    if (!name || !number || !date || !cvv || !amount) {
      return res.render('deposit-page', { message: '', error: 'All fields are required' });
    }

    let user = await User.findById(userId);
    if (!user) {
      return res.render('deposit-page', { message: '', error: 'User not found' });
    }

    if (!Array.isArray(user.cards)) {
      user.cards = [];
    }

    const cardNumber = Number(number);
    let card = user.cards.find(card => card.number === cardNumber);

    let newBalance;
    if (card) {
      card.funds = (card.funds || 0) + parseFloat(amount);
      newBalance = card.funds;
    } else {
      const newCard = new Card({
        name,
        number: cardNumber,
        date,
        cvv: Number(cvv),
        funds: parseFloat(amount)
      });
      user.cards.push(newCard);
      newBalance = newCard.funds;
    }

    await user.save();

    res.render('deposit-page', {
      message: 'Money has been added to your account. Your new balance is: ' + newBalance + ' SAR',
      error: ''
    });
  } catch (error) {
    console.error('Error handling /deposit_money:', error.message);
    res.render('deposit-page', { message: '', error: 'Internal Server Error' });
  }
});

// Handle money withdraw
app.post('/withdraw_money', (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login-page');
}, async (req, res) => {
  const { amount, iban } = req.body;
  const userId = req.user._id;

  try {
    if (!amount || !iban) {
      return res.render('withdraw-page', { message: '', error: 'All fields are required' });
    }

    let user = await User.findById(userId);
    if (!user) {
      return res.render('withdraw-page', { message: '', error: 'User not found' });
    }

    let totalFunds = user.cards.reduce((total, card) => total + (card.funds || 0), 0);

    if (totalFunds < amount) {
      return res.render('withdraw-page', { message: '', error: 'Insufficient funds' });
    }

    let remainingAmount = amount;
    for (let card of user.cards) {
      if (remainingAmount <= 0) break;
      if (card.funds > 0) {
        if (card.funds >= remainingAmount) {
          card.funds -= remainingAmount;
          remainingAmount = 0;
        } else {
          remainingAmount -= card.funds;
          card.funds = 0;
        }
      }
    }

    await user.save();

    let newBalance = user.cards.reduce((total, card) => total + (card.funds || 0), 0);

    res.render('withdraw-page', {
      message: `Withdrawal was successful. Your new balance is: ${newBalance} SAR`,
      error: ''
    });
  } catch (error) {
    console.error('Error handling /withdraw_money:', error.message);
    res.render('withdraw-page', { message: '', error: 'Internal Server Error' });
  }
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).render('error-page');
});

// Start the server
mongoose.connect(process.env.MONGO_URI)
  .then((result) => {
    console.log(`Successfully connected to database server..`);
    app.listen(process.env.Port, () => {
      console.log(`Web server listening on port ${process.env.Port}`);
    });
    
  })
  .catch((error) => {
    console.log(error);
  });

