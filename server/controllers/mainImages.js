const { PrismaClient } = require("@prisma/client");
const prisma = require("../utills/db"); // ✅ Use shared connection

async function uploadMainImage(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No File Uploaded" });
    }
  
    // Get file from a request
    const uploadedFile = req.files.uploadedFile;
  
    // Using mv method for moving file to the directory on the server
    uploadedFile.mv('../public/' + uploadedFile.name, (err) => {
      if (err) {
        return res.status(500).send(err);
      }
  
      res.status(200).json({ message: "File uploaded successfully" });
    });
  }

  module.exports = {
    uploadMainImage
};