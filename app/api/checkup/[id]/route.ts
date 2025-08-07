import { getServerSession } from 'next-auth/next'; 
import { authOptions } from '@/config/authOptions'; 
import dbConnect from '@/lib/dbConnect';

interface SessionUser {
    id: string;
    name: string;
    username: string;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const {id} = params
        if (!id) {
            return new Response(JSON.stringify({ error: 'Checkup ID is required' }), { status: 400 });
        }
        const client = await dbConnect();

        const session = await getServerSession(authOptions);

        if (!session) {
            console.log('unauthentic');
            return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });
        }

        const user = session.user as SessionUser;

        const { data: checkup, error } = await client
            .from('med_consultations')
            .select(`
            id,
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
            doctor_id,
            created_at,
            med_doctors (
                name
            )
            `)
            .eq('doctor_id', user.id)
            .eq('id', id)
            .single();

        if (checkup && checkup.med_doctors) {
            checkup.doctor_name = checkup.med_doctors.name;
            delete checkup.med_doctors;
        }

        if (error) {
            console.error(error);
            return new Response(JSON.stringify({ error: 'Failed to fetch checkups' }), { status: 500 });
        }

        if(!checkup) {
            return new Response(JSON.stringify({ error: 'Checkup not found' }), { status: 404 });
        }

        return new Response(JSON.stringify(checkup), { status: 200 });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}

