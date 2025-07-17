import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../utils/dbConnect'
import Card from '../../../models/Card'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { method } = req
    const { id } = req.query // id est extrait de l'URL

    await dbConnect()

    switch (method) {
        case 'GET':
            try {
                const card = await Card.findById(id);
                if (!card) {
                    return res.status(404).json({ success: false })
                }
                res.status(200).json({ success: true, data: card })
            } catch (error) {
                console.error(error);
                res.status(400).json({ success: false })
            }
            break
        case 'PATCH':
            try {
                const card = await Card.findByIdAndUpdate(id, req.body, {
                    new: true,
                    runValidators: true,
                });
                if (!card) {
                    return res.status(404).json({ success: false })
                }
                res.status(200).json({ success: true, data: card })
            } catch (error) {
                console.error(error);
                res.status(400).json({ success: false })
            }
            break
        // Gérez d'autres méthodes HTTP si nécessaire
        default:
            res.status(400).json({ success: false })
            break
    }
}