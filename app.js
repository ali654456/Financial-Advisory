// Import dependencies
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const { OpenAI } = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Import schemas
const User = require('./models/User');
const Card = require('./models/Card');
const Transaction = require('./models/Transaction');
const Investment = require('./models/Investment');

// Import functions
const { sendEmail } = require('./public/js/email-service');
const { faker } = require('@faker-js/faker');


const app = express();

app.set('view engine', 'ejs');

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
  cookie: { secure: false }
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

// Routes
app.get('/', (req, res) => {
  res.redirect('/login-page');
});

app.get('/login-page', (req, res) => {
  res.render('login-page', { message: req.flash('error') });
});

app.get('/signup-page', (req, res) => {
  res.render('signup-page', { message: '', error: '' });
});

app.get('/forget-password-page', (req, res) => {
  res.render('forget-password-page', { message: '', error: '' });
});

app.get('/home-page', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  res.render('home-page', { message: '', error: '', user: req.user, card: req.user.cards });
});

app.get('/deposit-page', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  res.render('deposit-page', { message: '', error: '' });
});

app.get('/withdraw-page', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  res.render('withdraw-page', { message: '', error: '' });
});

app.get('/link-account-page', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  res.render('link-account-page', { message: '', error: '' });
});

app.get('/Investo-ai-page', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  res.render('Investo-ai-page', { message: '', error: '' });
});

app.get('/my-transactions-page', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  try {
    const user = await User.findById(req.user._id).populate('transactions');
    const transactions = user.transactions;

    if (!Array.isArray(transactions)) {
      throw new Error('Transactions is not an array');
    }

    res.render('my-transactions-page', { message: '', error: '', transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.render('my-transactions-page', { message: '', error: 'Failed to fetch transactions', transactions: [] });
  }
});

app.get('/options-page', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login-page');
  }
  res.render('options-page', { message: '', error: '' });
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/home-page',
  failureRedirect: '/login-page',
  failureFlash: true
}));

app.post('/submit-signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username: username }, { email: email }] });

    if (existingUser) {
      return res.render('signup-page', { message: '', error: 'Username or email already exists' });
    }

    const newUser = new User({ 
      username: username, 
      email: email, 
      password: password,
      wallet: 0,
      cards: [],
      investments: [],
      transactions: []
    });

    await newUser.save();

    res.render('signup-page', { message: 'User added successfully', error: '' });
  } catch (error) {
    console.log(`Could not add user: ${error}`);
    res.render('signup-page', { message: '', error: 'Could not add user, please try again later' });
  }
});

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
      bank: bankAccount,
      funds: 10000
    });

    user.cards.push(newCard);

    const transactions = generateFakeTransactions(10);
    user.transactions = user.transactions.concat(transactions);

    await user.save();

    res.render('link-account-page', { message: 'Card has been linked to your account', error: '' });
  } catch (error) {
    res.render('link-account-page', { message: '', error: 'Could not link card to your account, try again later' });
    console.log(error);
  }
});

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

    const cardNumber = String(number);
    console.log('User cards:', user.cards);

    let card = user.cards.find(card => String(card.number) === cardNumber);

    if (!card) {
      console.log('Card not found for number:', cardNumber);
      return res.render('deposit-page', { message: '', error: 'Card not found' });
    }

    if (card.funds < parseFloat(amount)) {
      return res.render('deposit-page', { message: '', error: 'Insufficient funds on the card' });
    }

    card.funds -= parseFloat(amount);

    user.wallet = (user.wallet || 0) + parseFloat(amount);
    const newBalance = user.wallet;

    await user.save();

    res.render('deposit-page', {
      message: 'Money has been added to your wallet. Your new wallet balance is: ' + newBalance + ' SAR',
      error: ''
    });
  } catch (error) {
    console.error('Error handling /deposit_money:', error.message);
    res.render('deposit-page', { message: '', error: 'Internal Server Error' });
  }
});

app.post('/withdraw_money', (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login-page');
}, async (req, res) => {
  const { iban, amount } = req.body;
  const userId = req.user._id;

  console.log('Request body:', req.body);

  try {
    if (!amount || !iban) {
      return res.render('withdraw-page', { message: '', error: 'All fields are required' });
    }

    let user = await User.findById(userId);
    if (!user) {
      return res.render('withdraw-page', { message: '', error: 'User not found' });
    }

    const withdrawAmount = parseFloat(amount);

    if (user.wallet < withdrawAmount) {
      return res.render('withdraw-page', { message: '', error: 'Insufficient funds in wallet' });
    }

    if (!Array.isArray(user.cards)) {
      user.cards = [];
    }

    const card = user.cards.find(card => String(card.iban) === String(iban));

    if (!card) {
      return res.render('withdraw-page', { message: '', error: 'Card not found' });
    }

    user.wallet -= withdrawAmount;
    card.funds += withdrawAmount;

    await user.save();

    res.render('withdraw-page', {
      message: `Withdrawal was successful. Your new wallet balance is: ${user.wallet} SAR`,
      error: ''
    });
  } catch (error) {
    console.error('Error handling /withdraw_money:', error.message);
    res.render('withdraw-page', { message: '', error: 'Internal Server Error' });
  }
});

app.post('/filter-transactions', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const { bankAccount } = req.body;
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'transactions',
      match: { bankAccount: bankAccount }
    });

    const transactions = user.transactions;

    if (!Array.isArray(transactions)) {
      throw new Error('Transactions is not an array');
    }

    res.json({ transactions });
  } catch (error) {
    console.error('Error filtering transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

app.post('/generate-transactions', async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = generateFakeTransactions(10);

    user.transactions = user.transactions.concat(transactions);

    await user.save();

    res.json({ message: 'Transactions generated successfully.' });
  } catch (error) {
    console.error('Error generating transactions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function generateFakeTransactions(count) {
  const categories = ['food', 'transportation', 'rent', 'amenities', 'mortgage'];
  const bankAccounts = ['Al Rajhi Bank', 'Saudi British Bank (SABB)', 'National Commercial Bank (NCB)'];
  const transactions = [];
  for (let i = 0; i < count; i++) {
    transactions.push({
      amount: faker.finance.amount(),
      date: faker.date.past(),
      category: faker.helpers.arrayElement(categories),
      bankAccount: faker.helpers.arrayElement(bankAccounts),
    });
  }
  return transactions;
}

app.use((req, res) => {
  res.status(404).render('error-page');
});

// Start the server
mongoose.connect(process.env.MONGO_URI)
  .then((result) => {
    console.log(`Successfully connected to database server..`);
    app.listen(process.env.PORT, () => {
      console.log(`Web server listening on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
