import express, { Request, Response } from 'express';
import dbConnect from '../../utils/dbConnect';
import Card from '../../models/Card';

const router = express.Router();

router.get('/api/cards', async (req: Request, res: Response) => {
    await dbConnect();

    try {
        const cards = await Card.find({});
        res.status(200).json(cards);
    } catch (error) {
        res.status(400).json({ success: false });
    }
});

export default router;