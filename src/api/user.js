const express = require("express");
const router = express.Router();
// mongodb user model
const User = require("../models/schema");


// mongodb user verification model
const UserVerification = require("../models/UserVerification");

// mongodb user verification model
const PasswordReset = require("../models/PasswordReset");
const Doctors = require("../models/Doctors");

const { ObjectId } = require("mongodb");

//email handler
const nodemailer = require("nodemailer");

//unique string
const { v4: uuidv4 } = require("uuid");

//env variables
require("dotenv").config();

//Password handler
const bcrypt = require("bcrypt");

//path for static verified page
const path = require("path");
const { json } = require("body-parser");

//nodemailer stuff
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "anjaliayer123@gmail.com",
    pass: "jnts ivqx iixp yhvn",
  },
});

router.get("/test", (req, res) => {
  res.send("Hi, I'm Fine");
});

//testing sucess
transporter.verify((error, sucess) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready for message");
    console.log("Sucess");
  }
});

//Signup
router.post("/signup", (req, res) => {
  let { name, email, password, dateOfBirth } = req.body;
  console.log(/^[a-zA-Z, ]*$/.test(name));

  name = name.trim();
  email = email.trim();
  password = password.trim();
  dateOfBirth = dateOfBirth.trim();

  if (name == "" || email == "" || password == "" ) {
    res.json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  } else if (!/^[a-zA-Z, ]*$/.test(name)) {
    res.json({
      messgae: "Invalid name entered",
    });
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res.json({
      status: "FAILED",
      messgae: "Invalid email entered",
    });
  } else if (password.length < 8) {
    res.json({
      status: "FAILED",
      messgae: "Password is too short",
    });
  } else {
    //Checking if user already exists
    User.find({ email })
      .then((result) => {
        if (result.length) {
          // A user already exists
          res.json({
            status: "FAILED",
            messgae: "User with the provided email already exists",
          });
        } else {
          //try to create new user
          //password handling
          const saltRounds = 10;
          bcrypt
            .hash(password, saltRounds)
            .then((hashedPassword) => {
              const newUser = new User({
                name,
                email,
                password: hashedPassword,
                dateOfBirth,
                verified: true,
              });
              newUser
                .save()
                .then((result) => {
                  //handle account verification
                  console.log('success')
                  res.status(200).json({status:"Success"})
                })
                .catch((err) => {
                  res.json({
                    status: "FAILED",
                    messgae: "An error occured while saving user account!",
                  });
                });
            })
            .catch((err) => {
              console.log(err);
              res.json({
                status: "FAILED",
                messgae: "Invalid name entered",
              });
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.json({
          status: "FAILED",
          messgae: "An error occurred while checking the existing user!",
        });
      });
  }
});

//send verification email
const sendVerificationEmail = ({ _id, email }, res) => {
  //url to be used in the email
  const currentUrl = "htpp://localhost:5000/";

  const uniqueString = uuidv4() + _id;
  const emailMessage = `
    <p>Verify your email address to complete the signup and login into your account.</p>
    <p>This link <b>expires in 6 hours</b>.</p>'
    <p>Press <a href="${currentUrl}user/verify/${_id}/${uniqueString}">here</a> to proceed.</p>
`;


  //mail options
  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: " Verify Your Email",
    html: emailMessage
  };

  //hash the uniqueString
  const saltRounds = 10;
  bcrypt
    .hash(uniqueString, saltRounds)
    .then((hashedUniqueString) => {
      //set values in userVerification collection
      const newVerification = new UserVerification({
        userId: _id,
        uniqueString: hashedUniqueString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 21600000,
      });
      newVerification
        .save()
        .then(() => {
          transporter
            .sendMail(mailOptions)
            .then(() => {
              //email sent and verification record sdaved
              res.json({
                status: "PENDING",
                messgae: "Verification email sent",
              });
            })
            .catch((error) => {
              console.log(error);
              res.json({
                status: "FAIL",
                messgae: "verification email failed",
              });
            });
        })
        .catch((error) => {
          console.log(error);
          res.json({
            status: "FAIL",
            messgae: "couldn't save verification email data!",
          });
        });
    })
    .catch(() => {
      res.json({
        status: "FAIL",
        messgae: "Empty credentials supplied",
      });
    });
};

//verify email
// const User = require('./models/User'); // Import your User model or whatever your model name is

router.get("/verify/:userId/:uniqueString", (req, res) => {
  const { userId, uniqueString } = req.params;
  console.log(userId);
  UserVerification.find({ userId })
    .then(() => {
      if (result.length > 0) {
        //user verification record exists so we proceed
        const { expiresAt } = result[0];
        const hashedUniqueString = result[0].uniqueString;

        //checking for expired unique string
        if (expiresAt < Date.now()) {
          //record has expired so we delete it
          UserVerification.deleteOne({ userId })
            .then((result) => {
              User.deleteOne({ _id: userId })
                .then(() => {
                  let message = "Link has expired.Please sign up again";
                  res.redirect("/user/verified/error=true&message=${message}");
                })
                .catch((error) => {
                  let message =
                    "Clearing user with expired unique string failed";
                  res.redirect("/user/verified/error=true&message=${message}");
                });
            })
            .catch((error) => {
              console.log(error);
              let message =
                "An error occured while clearing expired user verification record.";
              res.redirect("/user/verified/error=true&message=${message}");
            });
        } else {
          //valid record exists so we validate the user string
          //First compare the hashed unique string

          bcrypt
            .compare(uniqueString, hashedUniqueString)
            .then((result) => {
              if (result) {
                //strings match

                User.updateOne({ _id: userId }, { verified: true })
                  .then(() => {
                    UserVerification.deleteOne(
                      { userId }
                        .then(() => {
                          res.sendFile(
                            path.join(__dirname, "./../views/verified.html")
                          );
                        })
                        .catch((error) => {
                          console.log(error);
                          let message =
                            "An error occured while finalizing sucessful verification.";
                          res.redirect(
                            "/user/verified/error=true&message=${message}"
                          );
                        })
                    );
                  })
                  .catch((error) => {
                    console.log(error);
                    let message =
                      "An error occured while checking user record to show verified.";
                    res.redirect(
                      "/user/verified/error=true&message=${message}"
                    );
                  });
              } else {
                //existing record but incorrect verification details passed.
                let message =
                  "Invalid verification details passed.Check you inbox.";
                res.redirect("/user/verified/error=true&message=${message}");
              }
            })
            .catch((error) => {
              let message = "An error occured while comparing unique string";
              res.redirect("/user/verified/error=true&message=${message}");
            });
        }
      } else {
        //user verification record doesn't exist
        let message =
          "Account record doesn't exist or has been verified already.Please sign up or log in.";
        res.redirect("/user/verified/error=true&message=${message}");
      }
      console.log("sucess");
    })
    .catch((e) => {
      console.log("error:", e);
      let message =
        "An error occured while checking for existing user verification record";
      res.redirect("/user/verified/error=true&message=${message}");
    });
});

//Verification page route
router.get("/verified", (req, res) => {});

//Signin
router.post("/signin", (req, res) => {
  let { email, password } = req.body;
  console.log(req.body)

  email = email.trim();
  password = password.trim();

  if (email == "" || password == "") {
    res.json({
      status: "FAIL",
      messgae: "Empty credentials supplied",
    });
  } else {
    User.find({ email })
      .then((data) => {
        if (data.length) {
          //Check user exists

          //check if user is verified

          if (!data[0].verified) {
            res.json({
              status: "FAILED",
              messgae: "Email has not been verified yet.Check your inbox",
            });
          } else {
            const hashedPassword = data[0].password;
            bcrypt
              .compare(password, hashedPassword)
              .then((result) => {
                if (result) {
                  //Password match
                  res.json({
                    status: "Success",
                    messgae: " Signin Sucessful",
                    data: data,
                  });
                } else {
                  res.json({
                    status: "FAILED",
                    message: "Invalid Password Entered",
                  });
                }
              })
              .catch((err) => {
                res.json({
                  status: "FAILED",
                  message: "An error occurred while comparing passwords",
                });
              });
          }
        } else {
          res.json({
            status: "FAILED",
            messgae: "Invalid credentials entered!",
          });
        }
      })
      .catch((err) => {
        res.json({
          status: "FAILED",
          messgae: "An error occurred while checking the existing user!",
        });
      });
  }
});

//Password reset stuff
router.post("/requestPasswordReset", (req, res) => {
  const { email, redirecturl } = req.body;

  //checking if email exists
  User.find({ email })
    .then((data) => {
      if (data.length) {
        //user exists

        //check if user is verified
        if (!data[0].verified) {
          res.json({
            status: "FAILED",
            messgae: "Email hasn't been verified yet.Check your inbox",
          });
        } else {
          //proceed with email to reset password
          sendResetEmail(data[0], redirecturl, res);
        }
      } else {
        res.json({
          status: "FAILED",
          messgae: "No account with supplied email exists",
        });
      }
    })
    .catch((error) => {
      console.log(error);
      res.json({
        status: "FAILED",
        messgae: "An error occurred while checking the existing user!",
      });
    });
});

//send password reset email
const sendResetEmail = ({ _id, email }, redirecturl, res) => {
  const resetString = uuidv4 + _id;

  //first we clear all existing reset records
  PasswordReset.deleteMany({ userId: _id })
    .then((result) => {
      //Reset records deleted sucessfully
      //Now we send the email

      //mail options
      const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: " Password Reset",
        html: `<p>We heard that you lost the password.</p><p>Don't worry,use the link below to reset it.</p><p>This link <b>expires in 60 minutes</b>.</><p>Press <a href=${
          redirecturl + "/" + _id + "/" + resetString
        }>here</a> to proceed.</p>`,
      };
      //hash the reset string
      const saltRounds = 10;
      bcrypt
        .hash(resetString, saltRounds)
        .then((hashedResetString) => {
          //set values in password reset collection
          const newPasswordReset = new PasswordReset({
            userId: _id,
            resetString: hashedResetString,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
          });
          newPasswordReset
            .save()
            .then(() => {
              transporter
                .sendMail(mailOptions)
                .then(() => {
                  //reset email sent and password reset record saved
                  res.json({
                    status: "PENDING",
                    message: "Password reset email sent",
                  });
                })
                .catch((error) => {
                  res.json({
                    status: "FAILED",
                    message: "Password reset email failed",
                  });
                });
            })
            .catch((error) => {
              console.log(error);
              res.json({
                status: "FAILED",
                message: "Couldn't save password reset data",
              });
            });
        })
        .catch((error) => {
          console.log(error);
          res.json({
            status: "FAILED",
            message: "An error occurred while hashing the password reset data",
          });
        });
    })
    .catch((error) => {
      //error while clearing existing records
      console.log(error);
      res.json({
        status: "FAILED",
        messgae: "Clearing all existing records failed!",
      });
    });
};

module.exports = router;
