import { db, getEmployeeList } from '$lib/db/db.server.js';
import { users, type RoleType } from '$lib/db/schema.js';
import { computeHash } from '$lib/server/utils.js';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export async function load(event) {
    const employees = await getEmployeeList();
    return {
        employees,
    };
}

export const actions = {
    addEmployee: async (event) => {
        const formData = await event.request.formData();
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const phoneNumber = formData.get('phoneNumber') as string;
        const password = formData.get('password') as string;
        const role = formData.get('role') as RoleType;

        const data = [firstName, lastName, phoneNumber, password, role];
        
        if (!data.every((value) => value !== null && value !== ''))
            return fail(400, {missing: true});
        
        const passwordHash = computeHash(password);
        const userid = (await db.insert(users).values({firstName, lastName, phoneNumber, role, password: passwordHash}).returning())[0].id;
        return {
            userid,
        };
    },
    editEmployee: async (event) => {
        const formData = await event.request.formData();
        const userid = formData.get('id') as string;
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const phoneNumber = formData.get('phoneNumber') as string;
        const password = formData.get('password') as string;
        const role = formData.get('role') as RoleType;
        const id = parseInt(userid);

        const data = [userid, firstName, lastName, phoneNumber, role];
        
        if (!data.every((value) => value !== null && value !== ''))
            return fail(400, {missing: true});

        const new_data: Partial<typeof users.$inferSelect> = {
            firstName, lastName, phoneNumber, role, 
        };
        if (password && password !== '')
            new_data.password = computeHash(password);

        await db.update(users).set(new_data).where(eq(users.id, id));
        return {
            success: true,
        };
    },
    deleteEmployee: async (event) => {
        const formData = await event.request.formData();
        const userid = formData.get('id') as string;

        if (!userid || userid === '')
            return fail(400, {missing: true});

        const id = parseInt(userid);

        await db.delete(users).where(eq(users.id, id));
        return {
            success: true,
        };
    },
};
