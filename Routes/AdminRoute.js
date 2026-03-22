import express from "express";
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

const router = express.Router();

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'employee_images',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    }
})

const upload = multer({ storage: storage })

router.post("/adminlogin", (req, res) => {
  const sql = "SELECT * FROM admin WHERE email = ?";
  con.query(sql, [req.body.email], (err, result) => {
    if (err) return res.json({ loginStatus: false, Error: "Query error: " + err.message });
    if (result.length > 0) {
      bcrypt.compare(req.body.password, result[0].password, (err, match) => {
        if (err) return res.json({ loginStatus: false, Error: "Bcrypt error: " + err.message });
        if (!match) return res.json({ loginStatus: false, Error: "Wrong email or password" });
        const token = jwt.sign(
          { role: "admin", email: result[0].email, id: result[0].id },
          "jwt_secret_key",
          { expiresIn: "1d" }
        );
        res.cookie('token', token);
        return res.json({ loginStatus: true });
      });
    } else {
      return res.json({ loginStatus: false, Error: "Wrong email or password" });
    }
  });
});

router.get('/category', (req, res) => {
    const sql = "SELECT * FROM category";
    con.query(sql, (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
        return res.json({Status: true, Result: result})
    })
})

router.post('/add_category', (req, res) => {
    const sql = "INSERT INTO category (`name`) VALUES (?)"
    con.query(sql, [req.body.category], (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
        return res.json({Status: true})
    })
})

router.post('/add_employee', upload.single('image'), (req, res) => {
    const sql = `INSERT INTO employee 
    (name, email, password, address, salary, image, category_id) 
    VALUES (?)`;
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        if(err) return res.json({Status: false, Error: "Bcrypt error: " + err.message})
        const values = [
            req.body.name,
            req.body.email,
            hash,
            req.body.address,
            req.body.salary,
            req.file.path,  // Cloudinary URL
            req.body.category_id
        ]
        con.query(sql, [values], (err, result) => {
            if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
            return res.json({Status: true})
        })
    })
})

router.get('/employee', (req, res) => {
    const sql = "SELECT * FROM employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
        return res.json({Status: true, Result: result})
    })
})

router.get('/employee/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM employee WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
        return res.json({Status: true, Result: result})
    })
})

router.put('/edit_employee/:id', (req, res) => {
    const id = req.params.id;
    const sql = `UPDATE employee 
        SET name = ?, email = ?, salary = ?, address = ?, category_id = ? 
        WHERE id = ?`
    const values = [
        req.body.name,
        req.body.email,
        req.body.salary,
        req.body.address,
        req.body.category_id
    ]
    con.query(sql, [...values, id], (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
        return res.json({Status: true, Result: result})
    })
})

router.delete('/delete_employee/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM employee WHERE id = ?"
    con.query(sql, [id], (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
        return res.json({Status: true, Result: result})
    })
})

router.get('/admin_count', (req, res) => {
    const sql = "SELECT COUNT(id) as admin FROM admin";
    con.query(sql, (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
        return res.json({Status: true, Result: result})
    })
})

router.get('/employee_count', (req, res) => {
    const sql = "SELECT COUNT(id) as employee FROM employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
        return res.json({Status: true, Result: result})
    })
})

router.get('/salary_count', (req, res) => {
    const sql = "SELECT SUM(salary) as salaryOFEmp FROM employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
        return res.json({Status: true, Result: result})
    })
})

router.get('/admin_records', (req, res) => {
    const sql = "SELECT * FROM admin"
    con.query(sql, (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
        return res.json({Status: true, Result: result})
    })
})

router.get('/admin_details/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT id, name, email FROM admin WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
        return res.json({Status: true, Result: result[0]})
    })
})

router.get('/audit_log', (req, res) => {
    const sql = "SELECT * FROM audit_log ORDER BY timestamp DESC";
    con.query(sql, (err, result) => {
        if(err) return res.json({Status: false, Error: "Query Error: " + err.message})
        return res.json({Status: true, Result: result})
    })
})

router.get('/logout', (req, res) => {
    res.clearCookie('token')
    return res.json({Status: true})
})

export { router as adminRouter };