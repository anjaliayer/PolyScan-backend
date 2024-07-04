const express = require("express");
const router = express.Router();
// mongodb user model
const User = require("../models/schema");


// mongodb user verification model
const UserVerification = require("../models/UserVerification");

//mongodb user otp verification model
const UserOTPVerification = require("./../models/UserOTPVerification");

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
const { Error } = require("mongoose");

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

//setting server url
const development = "http://localhost:5000/";
 const currentUrl = process.env;



router.post("/signup", async (req, res) => {
  let { name, email, password, dateOfBirth } = req.body;

  name = name.trim();
  email = email.trim();
  password = password.trim();
  dateOfBirth = dateOfBirth.trim();

  if (name === "" || email === "" || password === "") {
    return res.status(400).json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  }

  if (!/^[a-zA-Z, ]*$/.test(name)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Invalid name entered",
    });
  }

  if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Invalid email entered",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      status: "FAILED",
      message: "Password is too short",
    });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        status: "FAILED",
        message: "User with the provided email already exists",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      dateOfBirth,
      verified: true,
    });

    const result = await newUser.save();

    // handle account verification
    // sendVerificationEmail(result, res);
    sendOTPVerificationEmail(result, res); 

    console.log('success');
    return res.status(200).json({ status: "Success" });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: "FAILED",
      message: "An error occurred while processing your request.",
    });
  }
});

router.post("/signup", async (req, res) => {
  let { name, email, password, dateOfBirth } = req.body;

  name = name.trim();
  email = email.trim();
  password = password.trim();
  dateOfBirth = dateOfBirth.trim();

  if (name === "" || email === "" || password === "" || dateOfBirth === "") {
    return res.status(400).json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  }

  if (!/^[a-zA-Z, ]*$/.test(name)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Invalid name entered",
    });
  }

  if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Invalid email entered",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      status: "FAILED",
      message: "Password is too short",
    });
  }

  const parsedDateOfBirth = new Date(dateOfBirth);
  if (isNaN(parsedDateOfBirth.getTime())) {
    return res.status(400).json({
      status: "FAILED",
      message: "Invalid date of birth entered",
    });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        status: "FAILED",
        message: "User with the provided email already exists",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      dateOfBirth: parsedDateOfBirth,
      verified: false,
    });

    const result = await newUser.save();

    sendOTPVerificationEmail(result)
      .then((emailResponse) => {
        res.status(200).json(emailResponse);
      })
      .catch((emailError) => {
        res.status(500).json({
          status: "FAILED",
          message: emailError.message,
        });
      });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: "FAILED",
      message: "An error occurred while processing your request.",
    });
  }
});




module.exports = router;



//send otp verifiaction email
// const sendOTPVerificationEmail = async({_id,email},res) =>{
//   try{
//     const otp = '{Math.floor(1000 + Math.random() * 9000)}';

//     //mail options
//     const mailOptions = {
//       from: process.env.AUTH_EMAIL,
//       to: email,
//       subject: "Verify Your Email",
//       html:'<p>Enter<b>${otp}</b> in the app to verify your email address and complete the process</p><p>This code<b>expires in 1 30 minutes</b></p>',
//     };

//     //hash the otp
//     const saltRounds = 10;

//     const hashedOTP = await bcrypt.hash(otp, saltRounds);
//     new UserOTPVerification({
//       userId: _id,
//       otp: hashedOTP,
//       createdAt: Date.now(),
//       expiresAt: Date.now() + 1800000,
//       });

//       //save otp record
//       await newOTPVerification.save();
//       await transporter.sendMail(mailOptions);
//       res.json({
//         status: "PENDING",
//         message:"Verification otp email sent",
//         data: {
//           userId: _id,
//           email,
//         },
//       })

//   }catch(error){
//     res.send({
//       status: "FAILED",
//       message: error.message,
//     })
//   }
// };

const sendOTPVerificationEmail = async ({ _id, email }) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    // mail options
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete the process.</p><p>This code <b>expires in 30 minutes</b>.</p>`,
    };

    // hash the otp
    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);

    const newOTPVerification = new UserOTPVerification({
      userId: _id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1800000, // 30 minutes
    });

    // save otp record
    await newOTPVerification.save();
    await transporter.sendMail(mailOptions);

    return {
      status: "PENDING",
      message: "Verification OTP email sent",
      data: {
        userId: _id,
        email,
      },
    };
  } catch (error) {
    throw new Error(error.message);
  }
};


//Verify otp email
// router.post("/verifyOTP",async (req, res) =>{
//   try{
//     let{userId,otp} = req.body;
//     if(!userId , otp ){
//       throw Error("Empty otp details are not allowed");
//     }else{
//       const UserOTPVerificationRecords = await UserOTPVerification.find({
//         userId,
//       });
//       if(UserOTPVerificationRecords.length <= 0){
//       //no record found 
//       throw new Error(
//         "Account record doesn't exist or has been verified already. Please sign up or log in."
//       );
//       }else{
//         //user otp record exists
//         const {expiresAt} = UserOTPVerificationRecords[0];
//         const hashedOTP = UserOTPVerificationRecords[0].otp;

//         if(expiresAt < Date.now()){
//           //user otp record has expired
//           await UserOTPVerification.deleteMany({userId});
//           throw new Error("Code has expired. Please request again");
//         }else{
//          const validOTP = await bcrypt.compare(otp, hashedOTP);
//          if(!validOTP){
//           //supplied otp is wrong
//           throw new Error("Invalid code passed. check your inbox");
//          }else{
//           //success
//           await User.updateOne({_id: userId },{verified: true});
//           await UserOTPVerification.deleteMany({userId});
//           res.json({
//             status:"VERIFIED",
//             message: "User email verified sucessfully.",
//           })
//          }
//         }

//       }

//     }
//   }catch(error){
//     res.json({
//       status: "FAILED",
//       message: error.message,
//     });

//   }
// })

router.post("/verifyOTP", async (req, res) => {
  try {
    let { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        status: "FAILED",
        message: "Empty OTP details are not allowed",
      });
    }

    const UserOTPVerificationRecords = await UserOTPVerification.find({
      userId,
    });

    if (UserOTPVerificationRecords.length <= 0) {
      // No record found
      return res.status(404).json({
        status: "FAILED",
        message: "Account record doesn't exist or has been verified already. Please sign up or log in.",
      });
    }

    // User OTP record exists
    const { expiresAt } = UserOTPVerificationRecords[0];
    const hashedOTP = UserOTPVerificationRecords[0].otp;

    if (expiresAt < Date.now()) {
      // User OTP record has expired
      await UserOTPVerification.deleteMany({ userId });
      return res.status(410).json({
        status: "FAILED",
        message: "Code has expired. Please request again",
      });
    }

    const validOTP = await bcrypt.compare(otp, hashedOTP);

    if (!validOTP) {
      // Supplied OTP is incorrect
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid code passed. Check your inbox",
      });
    }

    // Success: Update user verification status
    await User.updateOne({ _id: userId }, { verified: true });
    await UserOTPVerification.deleteMany({ userId });

    return res.status(200).json({
      status: "VERIFIED",
      message: "User email verified successfully.",
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
});

module.exports = router;

   







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
              //email sent and verification record saved
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
//resend verification
router.post("/resendVerificationLink",async(req,res)=>{
  try{
      let{userId,uniqueString}=req.params;
        if(!userId || !email){
          throw Error("Empty user details are not allowed");
        }else{
          //delete existing record and resend
          await UserVerification.deleteMany({userId});
          sendVerificationEmail({_id: userId,email},res);

        }
  }catch(error){
    res.json({
      status: "FAILED",
      message: 'Verification link resend error.${error.message}'
    })

  }

})

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

// Password reset stuff
router.post("/requestPasswordReset", (req, res) => {
  const { email, redirecturl } = req.body;
  console.log(req.body)



  //checking if email exists
  User.findOne({ email })
    .then((data) => {
      if (data ) {
        //user exists
        //check if user is verified
        if (!data.verified) {
          res.json({
            status: "FAILED",
            messgae: "Email hasn't been verified yet.Check your inbox",
          });
        } else {
          //proceed with email to reset password
          sendResetEmail(data, redirecturl, res);
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
// router.post("/requestPasswordReset", async (req, res) => {
//   const { email, redirecturl } = req.body;
//   console.log(req.body);

//   try {
//     // Checking if email exists
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.json({
//         status: "FAILED",
//         message: "No account with the supplied email exists",
//       });
//     }

//     // Check if user is verified
//     if (!user.verified) {
//       return res.json({
//         status: "FAILED",
//         message: "Email hasn't been verified yet. Check your inbox",
//       });
//     }

//     // Proceed with email to reset password
//     await sendResetEmail(user, redirecturl, res);

//   } catch (error) {
//     console.error(error);
//     res.json({
//       status: "FAILED",
//       message: "An error occurred while checking the existing user!",
//     });
//   }
// });


module.exports = router;

//send password reset email
const sendResetEmail = ({ _id, email }, redirecturl, res) => {
  const resetString = uuidv4() + _id;
    const baseURL= "http://localhost:5000"

  

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
        html: `<p>We heard that you lost the password.</p><p>Don't worry,use the link below to reset it.</p> "${baseURL}/${_id}/${resetString} "<p>This link <b>expires in 60 minutes</b>.</><p>Press <a href=${
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

//Actually reset the password
router.post("/resetPassword",(req,res)=>{
  let{userId,resetString,newPassword}=req.body;
  PasswordReset
  .find({userId})
  .then(result=>{
    if(result.length > 0){
      //Password reset record exists so we proceed

    const {expiresAt}=result[0];
    const hashedResetString = result[0].resetString;

    //Checking foer expired reset string
    if(expiresAt < Date.now()){
      PasswordReset
      .deleteOne({userId})
      .then(() => {
         //Reset record deleted sucessfully
      res.json({
        status: "FAILED",
        messgae: "Password reset link has expired",
      })
      })
      .catch(error =>{
        //deletion failed
      res.json({
        status: "FAILED",
        messgae: "Clearing all existing records failed!",
      });
        
      })

    }else{
      //valid reset record exists so we validate the reset string
      //First compare the hashed reset string
      bcrypt
      .compare(resetString, hashedResetString)
      .then((result)=>{
       if(result){
        //string matched
        //hash password again

        const saltRounds = 10;
        bcrypt
        .hash(newPassword,saltRounds)
        .then(hashedNewPassword=>{
          //Update user password
         User
         .updateOne({_id: userId},{password:hashedNewPassword})
         .then(()=> {
          //Update complete. Now delete reset record
          PasswordReset
          .deleteOne({userId})
          .then(()=>{
            //both user record and reset record updated
            res.json({
              status: "SUCCESS",
              messgae: "Pssword has been reset sucessfully.",
            });

          })
          .catch(error=>{
            console.log(error);
            res.json({
              status: "FAILED",
              messgae: "An error occured while finalizing password reset",
            });
          })
         })
         .catch(error=>{
          console.log(error);
          res.json({
            status: "FAILED",
            messgae: "Updating user password failed!",
          });

         })
        })
        .catch(error=>{
          console.log(error);
          res.json({
            status: "FAILED",
            messgae: "An error occured while hashing new password",
          });
        })
       }else{
        //Existing record but incorrect reset string passed
        res.json({
          status: "FAILED",
          messgae: "Invalid password reset details passed.",
        });
       }
      })
      .catch(error =>{
        res.json({
          status: "FAILED",
          messgae: "Comparing password reset string failed.",
        });
      })

    }

    }else{
      //Password reset record doesn't exist
      res.json({
        status:"FAILED",
        message:"Password reset request not found",
      })
    }
  })
  .catch(error =>{
    console.log(error);
    res.json({
      status: "FAILED",
      messgae: "Checking for existing password reset record failed",

  })
})
})

module.exports = router;
