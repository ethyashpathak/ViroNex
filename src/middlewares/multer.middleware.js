import multer from "multer";

// Basically setting up a place where the files we upload are gonna land...
const storage = multer.diskStorage({
  
  // 'destination' is just a fancy way of saying "where does this file go?"
  destination: function (req, file, cb) {
    
    // So, we're telling it: no errors (that's the 'null'), just dump the file in the './public/temp' folder for now,btw the cb means callback!
    cb(null, './public/temp')
  },
  
  // 'filename' is how we tell it what to name the file once it's saved.
  filename: function (req, file, cb) {
    
    // we are using the original name in which the user has uploaded the file...
    cb(null, file.originalname)
  }
})
//syntax for exporting the multer middleware response...
export const upload = multer({ storage: storage })