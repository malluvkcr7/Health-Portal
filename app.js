import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import session from "express-session"; // Import express-session

const saltRounds = 10;

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));

// Use express-session middleware
var patientuser="";
var patientspecialist="";
var doctorspecialist="";

app.use(session({
    secret: 'your-secret-key', // Replace with your own secret key
    resave: false,
    saveUninitialized: true
}));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/patientlogindb');
  // Update the database connection URL and options as needed
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  password: String,
});
const appointmentSchema = new mongoose.Schema({
    patientuser: String,
    problem: String,
    date: Date,
    time: String,
    specialist:String
  });
  const personalInfoSchema = new mongoose.Schema({
      patientuser: String,
      name: String,
      dob: Date,
      weight: Number,
      height: Number,
      gender: String,
      bloodGroup: String,
      allergies: String,
      surgeries: String,
      medications: String,
      alcohol: String,
      smoking: String,
      caffeine: String,
  });
  const doctorInfoSchema = new mongoose.Schema({
      username: String,
      doctorSpecialist: String, // Rename the field for doctor specialist
  });
  // Create a new schema for doctor's remarks and prescriptions
const RecordSchema = new mongoose.Schema({
    patientUsername: String,
    doctorRemarks: String,
    prescriptions: [{
        medicine: String,
        dosage: String,
    }],
});

// Create a model for the records
const Record = mongoose.model('Record', RecordSchema);

  
  const DoctorInfo = mongoose.model('DoctorInfo', doctorInfoSchema);
  const PersonalInfo = mongoose.model('PersonalInfo', personalInfoSchema);
  
  
  const Appointment = mongoose.model('Appointment', appointmentSchema);
  const User = mongoose.model('User', userSchema);
  const Doctor = mongoose.model('Doctor', userSchema);
  

// ... (Your other schemas)

// ... (Your other models)

// Define routes

// Handle GET request for the homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/templates/index.html');
});
app.get('/patient-login.html', (req, res) => {
    res.sendFile(__dirname + '/public/templates/signup.html');
});



app.get('/doctor-login.html', (req, res) => {
    res.sendFile(__dirname + '/public/templates/dsignup.html');
});
// Define a route for creating a new account
app.get('/create-account', (req, res) => {
    res.sendFile(__dirname + '/public/templates/create-account.html');
});
app.post('/create-account', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const newUser = new User({
            username: req.body.username,
            password: hashedPassword
        });
        const registered = await newUser.save();
        //console.log('User registered:', registered);

        // Store patient user information in the PersonalInfo model
        const newPersonalInfo = new PersonalInfo({
            patientuser: req.body.username,
            // Add other patient-related fields
        });
        await newPersonalInfo.save();

        res.redirect('/patient-login.html');
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Error creating user.');
    }
});

app.get('/dcreate-account', (req, res) => {
    res.sendFile(__dirname + '/public/templates/dcreate-account.html');
});
// Handle POST request for processing account creation
// Handle GET request for the forgot password page
app.post('/dcreate-account', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const newUser = new Doctor({
            username: req.body.username,
            password: hashedPassword
        });

        const registered = await newUser.save();
        //console.log('Doctor registered:', registered);

        // Save the doctor specialist in the DoctorInfo collection
        const doctorInfo = new DoctorInfo({
            username: req.body.username,
            doctorSpecialist: req.body.specialist
        });
        await doctorInfo.save();

        res.redirect('/doctor-login.html');
    } catch (error) {
        console.error('Error creating doctor:', error);
        res.status(500).send('Error creating doctor.');
    }
});


app.get('/forgot-password.html', (req, res) => {
    res.sendFile(__dirname + '/public/templates/forgot-password.html');
});
app.get('/dforgot-password.html', (req, res) => {
    res.sendFile(__dirname + '/public/templates/dforgot-password.html');
});

app.post('/process-account-creation', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const confirmPassword = req.body['confirm-password'];

    // Perform account creation and validation here

    // After processing, you can redirect the user to the signup page
    res.redirect('/create-account');
});
app.post('/process-account-creation', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const confirmPassword = req.body['confirm-password'];

    // Perform account creation and validation here

    // After processing, you can redirect the user to the signup page
    res.redirect('/dcreate-account');
});
// Handle GET request for the signup page
app.get('/signup.html', (req, res) => {
    res.sendFile(__dirname + '/public/templates/signup.html');
});
// Handle POST request for processing password reset
// Handle POST request for resetting the password
app.post('/reset-password', async (req, res) => {
    const username = req.body.username;
    const newPassword = req.body['new-password'];
    const confirmNewPassword = req.body['confirm-new-password'];

    // Check if newPassword and confirmNewPassword match
    if (newPassword !== confirmNewPassword) {
        res.status(400).send("Passwords do not match. Please try again.");
        return;
    }

    try {
        // Find the user by their username
        const user = await User.findOne({ username });

        if (!user) {
            res.status(404).send("User not found.");
            return;
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the user's password in the database
        user.password = hashedPassword;
        await user.save();

        res.redirect('/patient-login.html'); // Redirect to login page after password reset
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).send('Error resetting password.');
    }
});
// Handle POST request for resetting the doctor's password
app.post('/dreset-password', async (req, res) => {
    const username = req.body.username;
    const newPassword = req.body['new-password'];
    const confirmNewPassword = req.body['confirm-new-password'];

    // Check if newPassword and confirmNewPassword match
    if (newPassword !== confirmNewPassword) {
        res.status(400).send("Passwords do not match. Please try again.");
        return;
    }

    try {
        // Find the doctor by their username
        const doctor = await Doctor.findOne({ username });

        if (!doctor) {
            res.status(404).send("Doctor not found.");
            return;
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the doctor's password in the database
        doctor.password = hashedPassword;
        await doctor.save();

        res.redirect('/doctor-login.html'); // Redirect to doctor's login page after password reset
    } catch (error) {
        console.error('Error resetting doctor password:', error);
        res.status(500).send('Error resetting doctor password.');
    }
});

// Handle POST request for patient login


// Store specialists in a session when users log in
app.post('/patient-login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        // Find the user by their username
        const user = await User.findOne({ username });

        if (!user) {
            res.status(404).send("User not found.");
            return;
        }

        // Compare the entered password with the stored hashed password
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            // Passwords match, allow login
            patientuser = username; // Store patient's username in the variable
            req.session.patientUsername = username; // Store patient's username in session
            req.session.patientSpecialist = req.body.specialist; // Store patient's specialist in session
            res.redirect('/patientdash.html');
        } else {
            // Passwords don't match, show error
            res.status(401).send("Invalid credentials. Please try again.");
        }
    } catch (error) {
        console.error('Error during patient login:', error);
        res.status(500).send('Error during login.');
    }
});

// Handle POST request for doctor login
app.post('/doctor-login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const chosenSpecialist = req.body.specialist; // Assuming specialist is sent in the login request

    try {
        // Find the doctor by their username
        const doctor = await Doctor.findOne({ username });

        if (!doctor) {
            res.status(404).send("Doctor not found.");
            return;
        }

        // Compare the entered password with the stored hashed password
        const match = await bcrypt.compare(password, doctor.password);

        if (match) {
            // Passwords match, allow login
            req.session.doctorUsername = username; // Store doctor's username in session

            // Create or update the doctor's specialist information in the DoctorInfo collection
            await DoctorInfo.findOneAndUpdate(
                { username },
                { username, doctorSpecialist: chosenSpecialist },
                { upsert: true } // Create a new document if it doesn't exist
            );

            req.session.doctorSpecialist = chosenSpecialist; // Store doctor's chosen specialist in session
            res.redirect('/doctordash.html');
        } else {
            // Passwords don't match, show error
            res.status(401).send("Invalid credentials. Please try again.");
        }
    } catch (error) {
        console.error('Error during doctor login:', error);
        res.status(500).send('Error during login.');
    }
});

app.get('/patientdash.html', (req, res) => {
    res.sendFile(__dirname + '/public/templates/patientdash.html');
});



app.get('/logout', (req, res) => {
    res.sendFile(__dirname + '/public/templates/signup.html');
});
app.get('/doctordash.html', (req, res) => {
    res.sendFile(__dirname + '/public/templates/doctordash.html');
});
app.get('/logout1', (req, res) => {
    res.sendFile(__dirname + '/public/templates/dsignup.html');
});
app.get('/index.html', (req, res) => {
    res.sendFile(__dirname + '/public/templates/index.html');
});



// Define a new route for doctors to view appointments
app.get('/viewappointments', async (req, res) => {
    const doctorUsername = req.session.doctorUsername; // Retrieve doctor's username from session
    const doctorSpecialist = req.session.doctorSpecialist; // Retrieve doctor's chosen specialist from session

    try {
        // Find appointments that match the doctor's chosen specialist
        const matchingAppointments = await Appointment.find({ specialist: doctorSpecialist });

        if (matchingAppointments.length === 0) {
            // If no matching appointments found, display a message or handle it as needed
            res.send("No appointments found for your specialist.");
        } else {
            // Display the matching appointments
            res.render('doctor-appointments.ejs', { appointments: matchingAppointments });
        }
    } catch (error) {
        console.error('Error while viewing appointments:', error);
        res.status(500).send('Error while viewing appointments.');
    }
});


app.route('/appointments')
  
    .get(async (req, res) => {
      try {
        // Retrieve and display appointments from the database for the logged-in user
        const patientUsername = req.session.patientUsername; // Get the patient's username from the session
  
        // Fetch appointments that match the patient's username
        const appointments = await Appointment.find({ patientuser: patientUsername });
  
        if (appointments.length === 0) {
          // If no matching appointments found, you can display a message or handle it as needed
          res.render('appointments.ejs', { appointments: [] }); // Pass an empty array to the template
          //console.log(appointments)
        } else {
          // Display the appointments as cards
          res.render('appointments.ejs', { appointments });
          //console.log(appointments)
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).send('Error fetching appointments.');
      }
    })
  
  
    app.post('/appointments', async (req, res) => {
        const { problem, date, time, specialist } = req.body;
        const patientuser = req.session.patientUsername;
    
        try {
            const existingAppointment = await Appointment.findOne({
                specialist,
                date,
                time,
            });
    
            if (existingAppointment) {
                // If an appointment exists for the same time and doctor
                // Send a JSON response indicating slot unavailability

                res.redirect('/error?message=Slot%20not%20available.%20Please%20choose%20another%20time.');
            } else {
                const newAppointment = new Appointment({
                    patientuser,
                    problem,
                    date,
                    time,
                    specialist,
                });
    
                await newAppointment.save();
                res.redirect(`/medical-records`);
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            res.status(500).send('Error creating appointment.');
        }
    });
// Define a route for the error page
app.get('/error', (req, res) => {
    // Extract the error message from the query parameter
    const errorMessage = req.query.message || 'An error occurred.';

    // Render the error page with the error message and a back button
    res.send(`
        <html>
            <head>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f9f9f9;
                        text-align: center;
                        margin: 0;
                        padding: 0;
                    }
                    .error-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                    }
                    .error-message {
                        color: white;
                        background-color: #e74c3c;
                        padding: 20px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                        width: 80%;
                    }
                    .back-button {
                        background-color: #3498db;
                        color: white;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    .back-button:hover {
                        background-color: #2980b9;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-message">
                        ${errorMessage}
                    </div>
                    <a href="/appointments" class="back-button">Back to Appointment Page</a>
                </div>
            </body>
        </html>
    `);
});


  
  app.route('/medical-records')

  .get(async (req, res) => {
    try {
      // Retrieve and display appointments from the database for the logged-in user
      const patientUsername = req.session.patientUsername; // Get the patient's username from the session

      // Fetch appointments that match the patient's username
      const personalInfo = await PersonalInfo.find({ patientuser: patientUsername });

      
        // Display the appointments as cards
        res.render('medical-records.ejs', { personalInfo });
        //console.log(personalInfo)
        
      
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).send('Error fetching appointments.');
    }
  })
  app.post('/medical-records', async (req, res) => {
    const patientUsername = req.session.patientUsername;
    const {
        name,
        dob,
        weight,
        height,
        gender,
        bloodGroup,
        allergies,
        surgeries,
        medications,
        alcohol,
        smoking,
        caffeine,
    } = req.body;

    try {
        // Find the personal information record by the patient's username
        const existingPersonalInfo = await PersonalInfo.findOne({ patientuser: patientUsername });

        if (existingPersonalInfo) {
            // If personal information for the patient already exists, update it
            existingPersonalInfo.name = name;
            existingPersonalInfo.dob = dob;
            existingPersonalInfo.weight = weight;
            existingPersonalInfo.height = height;
            existingPersonalInfo.gender = gender;
            existingPersonalInfo.bloodGroup = bloodGroup;
            existingPersonalInfo.allergies = allergies;
            existingPersonalInfo.surgeries = surgeries;
            existingPersonalInfo.medications = medications;
            existingPersonalInfo.alcohol = alcohol;
            existingPersonalInfo.smoking = smoking;
            existingPersonalInfo.caffeine = caffeine;

            await existingPersonalInfo.save();
        } else {
            // If personal information doesn't exist for the patient, create a new record
            const newPersonalInfo = new PersonalInfo({
                patientuser: patientUsername,
                name,
                dob,
                weight,
                height,
                gender,
                bloodGroup,
                allergies,
                surgeries,
                medications,
                alcohol,
                smoking,
                caffeine,
            });

            await newPersonalInfo.save();
        }

        // Fetch the updated personal information
        const updatedPersonalInfo = await PersonalInfo.findOne({ patientuser: patientUsername });

        // Render the medical-records.ejs template with the updated data
        //console.log(updatedPersonalInfo);
        res.render('medical-records.ejs', { personalInfo: [updatedPersonalInfo] });
    } catch (error) {
        console.error('Error saving/updating personal information:', error);
        res.status(500).send('Error saving/updating personal information.');
    }
});


// Define a route to view patient personal info
app.get('/view-personal-info/:username', async (req, res) => {
    try {
        const username = req.params.username;
        
        // Fetch the personal information of the patient with the given username
        const personalInfo = await PersonalInfo.findOne({ patientuser: username });

        if (!personalInfo) {
            res.status(404).send("Personal information not found for this user.");
            return;
        }

        // Render a page to display the personal information
        res.render('view-personal-info', { personalInfo });
    } catch (error) {
        console.error('Error viewing personal information:', error);
        res.status(500).send('Error viewing personal information.');
    }
});
app.post('/submit-records', async (req, res) => {
    const patientUsername = req.session.patientUsername; // Get the patient's username from the session
    const doctorRemarks = req.body.doctorRemarks; // Get doctor's remarks

    // Parse the medications from JSON
    const medications = JSON.parse(req.body.medications || '[]');

    try {
        // Create a new record entry
        const record = new Record({
            patientUsername,
            doctorRemarks,
            prescriptions: medications, // Assign the parsed medications array
        });

        // Save the record to the database
        await record.save();
        res.redirect('/viewappointments');

        // Redirect to a success page or any other relevant page
        
    } catch (error) {
        console.error('Error saving doctor records:', error);
        res.status(500).send('Error saving doctor records.');
    }
});

// Route to fetch appointments
app.get('/patient-records', async (req, res) => {
    try {
        
        // Retrieve the patient's records from the database
        const patientUsername = req.session.patientUsername; // Get the patient's username from the session
        //console.log(patientUsername);
        //console.log("Hello")
        const records = await Record.find({ patientUsername }); 
        res.render('patient-records.ejs', { records });
        

        // Render the EJS template to display the records
       
    } catch (error) {
        console.error('Error fetching patient records:', error);
        res.status(500).send('Error fetching patient records.');
    }
});

// Example route for deleting appointments
app.delete('/delete-appointment/:appointmentId', async (req, res) => {
    const appointmentId = req.params.appointmentId;

    try {
        // Find the appointment by its ID and remove it from the database
        const deletedAppointment = await Appointment.findByIdAndRemove(appointmentId);

        if (!deletedAppointment) {
            res.status(404).send("Appointment not found.");
        } else {
            res.status(204).end(); // Send a success response with no content
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).send('Error deleting appointment.');
    }
});







app.get('/success', (req, res) => {
    res.sendFile(__dirname + '/public/templates/success.html');
});
app.get('/task', (req, res) => {
    res.sendFile(__dirname + '/public/templates/task.html');
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});