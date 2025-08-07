import { getServerSession } from 'next-auth/next'; 
import { authOptions } from '@/config/authOptions'; 
import dbConnect from '@/lib/dbConnect';

interface CheckupRequestBody {
    patient_name: string;
    patient_age: number;
    patient_gender: string;
    temperature?: number;
    blood_pressure?: string;
    blood_sugar?: number;
    symptoms: string;
    diagnosis: string;
    medications?: string;
    lab_tests?: string;
    notes?: string;
    consultation_audio_url?: string;
    audio_public_id?: string;
}

interface SessionUser {
    id: string;
    name: string;
    username: string;
}

export async function POST(req: Request) {
    try {
        const client = await dbConnect();

        const {
            patient_name,
            patient_age,
            patient_gender,
            temperature,
            blood_pressure,
            blood_sugar,
            symptoms,
            diagnosis,
            medications,
            lab_tests,
            notes,
            consultation_audio_url,
            audio_public_id
        }: CheckupRequestBody = await req.json();

        if (
            !symptoms ||
            !diagnosis ||
            (!medications && !lab_tests && !notes && !consultation_audio_url && !audio_public_id)
        ) {
            return new Response(JSON.stringify({ error: 'Missing Fields in request body' }), { status: 400 });
        }

        const session = await getServerSession(authOptions);

        if (!session) {
            console.log('unauthentic');
            return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });
        }

        const user = session.user as SessionUser;

        const { data: checkup, error: checkupError } = await client.from('med_consultations').insert({
            patient_name,
            patient_age,
            patient_gender,
            temperature,
            blood_pressure,
            blood_sugar,
            symptoms,
            diagnosis,
            medications,
            lab_tests,
            notes,
            consultation_audio_url,
            audio_public_id,
            doctor_id: user.id
        }).select();

        if (checkupError) {
            console.error(checkupError);
            return new Response(JSON.stringify({ error: 'Failed to add checkup' }), { status: 500 });
        }

        console.log(checkup);

        return new Response(JSON.stringify({ message: 'Checkup added successfully', checkup_id: checkup[0].id }), { status: 201 });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const client = await dbConnect();

        const session = await getServerSession(authOptions);

        if (!session) {
            console.log('unauthentic');
            return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });
        }

        const user = session.user as SessionUser;

        const { data: checkups, error } = await client
            .from('med_consultations')
            .select('id, patient_name, patient_age, patient_gender, temperature, blood_pressure, blood_sugar, symptoms, diagnosis, medications, lab_tests, notes, doctor_id, created_at')
            .eq('doctor_id', user.id)
            .order('created_at', { ascending: false }) // fetch in inverse chronological order (most recent first)
            .limit(10); // limit to 20 checkups

        if (error) {
            console.error(error);
            return new Response(JSON.stringify({ error: 'Failed to fetch checkups' }), { status: 500 });
        }

        return new Response(JSON.stringify(checkups), { status: 200 });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}

