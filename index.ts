// #region 'Importing and configuration of Prisma'
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static('public'));

app.get('/', async (req, res) => {
    res.send('Server Up and Running');
});

app.listen(4000, () => {
    console.log(`Server up: http://localhost:4000`);
});
// #endregion


// #region "Token, and getting user loggied in, register, validating if user is logged in"
function createToken(id: number) {

    //@ts-ignore
    const token = jwt.sign({ id: id }, process.env.MY_SECRET, {
        expiresIn: '3days'
    });

    return token;

}

async function getUserFromToken(token: string) {

    //@ts-ignore
    const data = jwt.verify(token, process.env.MY_SECRET);

    const user = await prisma.user.findUnique({
        // @ts-ignore
        where: { id: data.id }
    });

    return user;

}

app.post('/sign-up', async (req, res) => {

    const { email, password, userName, firstName, lastName, address, bio, phone, avatar, isDoctor } = req.body;

    try {

        const hash = bcrypt.hashSync(password);
        
        const user = await prisma.user.create({

            //@ts-ignore
            data: { 
                email: email, 
                password: hash, 
                userName: userName, 
                firstName: firstName, 
                lastName: lastName,
                //@ts-ignore
                address: address,
                bio: bio,
                phone: phone,
                avatar: avatar, 
                isDoctor: isDoctor
            }

        });

        res.send({ user, token: createToken(user.id) });

    } 
    
    catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message });
    }

});

app.post('/login', async (req, res) => {

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    // @ts-ignore
    const passwordMatches = bcrypt.compareSync(password, user.password);
    
    if (user && passwordMatches) {
        res.send({ user, token: createToken(user.id) });
    } 
    
    else {
        throw Error('Boom');
    }

});

app.get('/validate', async (req, res) => {

    const token = req.headers.authorization || '';

    try {
        const user = await getUserFromToken(token);
        res.send(user);
    } 
    
    catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message });
    }

});
// #endregion


// #region "REST API endpoints"

// #region "Users as normal users endpoints"
app.get('/users', async (req, res) => {

    try {

        const users = await prisma.user.findMany({

            include: {
                postedAppointements: true,
            },

            where: {
                //@ts-ignore
                isDoctor: false
            }

        });

        res.send(users)
  
    } 
    
    catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message });
    }

});

app.get("/users/:id", async (req, res) => {

    const id = Number(req.params.id);

    try {

      const employee: any = await prisma.user.findUnique({
        where: { id },
        //@ts-ignore
        include: { acceptedAppointemets: true }
      });

      if (employee) {
        res.send(employee);
      } 
      
      else {
        res.status(404).send({ error: "Employee not found" });
      }

    } 
    
    catch (err) {
      //@ts-ignore
      res.status(400).send({ error: err.message });
    }

});
// #endregion

// #region "Users as doctors endpoints"
app.get('/doctors', async (req, res) => {

    try {

        const doctors = await prisma.user.findMany({

            include: {
                acceptedAppointemets: true
            },

            where: {
                //@ts-ignore
                isDoctor: true
            }

        });

        res.send(doctors)
  
    } 
    
    catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message });
    }

});

app.get("/doctors/:id", async (req, res) => {

    const id = Number(req.params.id);

    try {

      const doctor = await prisma.user.findUnique({
        where: { id },
        include: { acceptedAppointemets: true }
      });

      if (doctor) {
        res.send(doctor);
      } 
      
      else {
        res.status(404).send({ error: "Doctor not found" });
      }

    } 
    
    catch (err) {
      //@ts-ignore
      res.status(400).send({ error: err.message });
    }

});
// #endregion

// #region "Categories endpoints"
app.get('/categories', async (req, res) => {

    try {

        const categories = await prisma.category.findMany({

            include: {
                appointements: true
            }

        });

        res.send(categories)
  
    } 
    
    catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message });
    }

});

app.get("/categories/:id", async (req, res) => {

    const id = Number(req.params.id);

    try {

      const category = await prisma.category.findUnique({

        where: { id },

        //@ts-ignore
        include: { appointements: true}

      });

      if (category) {
        res.send(category);
      } 
      
      else {
        res.status(404).send({ error: "Category not found" });
      }

    } 
    
    catch (err) {
      //@ts-ignore
      res.status(400).send({ error: err.message });
    }

});
// #endregion

// #region "Appointements endpoints"
app.get('/appointements', async (req, res) => {

    try {

        const appointements = await prisma.appointement.findMany({

            include: {
                normalUser: true,
                doctor: true,
                category: true,
                bids: true
            }

        });

        res.send(appointements)
  
    } 
    
    catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message });
    }

});

app.get("/appointements/:id", async (req, res) => {

    const id = Number(req.params.id);

    try {

      const appointement = await prisma.appointement.findUnique({

        where: { id },

        include: {
            normalUser: true,
            doctor: true,
            category: true,
            bids: true
        }

      });

      if (appointement) {
        res.send(appointement);
      } 
      
      else {
        res.status(404).send({ error: "Appointement not found" });
      }

    } 
    
    catch (err) {
      //@ts-ignore
      res.status(400).send({ error: err.message });
    }

});
// #endregion

// #region "Bids endpoints"
app.get('/bids', async (req, res) => {

    try {

        const bids = await prisma.bid.findMany({

            include: {
                normalUser: true,
                appointement: true
            }

        });

        res.send(bids)
  
    } 
    
    catch (err) {
        // @ts-ignore
        res.status(400).send({ error: err.message });
    }

});

app.get("/bids/:id", async (req, res) => {

    const id = Number(req.params.id);

    try {

      const bid = await prisma.bid.findUnique({

        where: { id },

        include: {
            normalUser: true,
            appointement: true
        }

      });

      if (bid) {
        res.send(bid);
      } 
      
      else {
        res.status(404).send({ error: "Bid not found" });
      }

    } 
    
    catch (err) {
      //@ts-ignore
      res.status(400).send({ error: err.message });
    }

});
// #endregion

// #endregion