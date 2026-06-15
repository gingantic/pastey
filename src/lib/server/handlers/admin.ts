import { getDB } from '../db';

export async function listUsers(url: URL, currentUser: any) {
	if (!currentUser || !currentUser.is_admin) {
		return { status: 403, error: 'forbidden: admin access required' };
	}

	const limitVal = url.searchParams.get('limit');
	const offsetVal = url.searchParams.get('offset');
	const search = url.searchParams.get('search') || undefined;

	let limit = parseInt(limitVal || '', 10);
	if (isNaN(limit) || limit <= 0 || limit > 100) {
		limit = 20;
	}

	let offset = parseInt(offsetVal || '', 10);
	if (isNaN(offset) || offset < 0) {
		offset = 0;
	}

	const db = await getDB();
	const users = await db.listUsers(limit, offset, search);
	const total = await db.countUsers(search);

	// Map to structure matching Go's AdminUserResponse
	const responseUsers = users.map(u => ({
		id: u.id,
		username: u.username,
		email: u.email,
		is_admin: u.is_admin,
		created_at: u.created_at.toISOString(),
		paste_count: u.paste_count
	}));

	return { status: 200, data: { users: responseUsers, total } };
}

export async function toggleAdmin(id: string, currentUser: any) {
	if (!currentUser || !currentUser.is_admin) {
		return { status: 403, error: 'forbidden: admin access required' };
	}

	if (currentUser.user_id === id) {
		return { status: 400, error: 'cannot toggle your own admin status' };
	}

	const db = await getDB();
	const user = await db.getUserById(id);
	if (!user) {
		return { status: 404, error: 'user not found' };
	}

	const newStatus = !user.is_admin;
	await db.toggleAdmin(id, newStatus);

	return { 
		status: 200, 
		data: { 
			message: 'user admin status updated', 
			is_admin: newStatus 
		} 
	};
}

export async function deleteUser(id: string, currentUser: any) {
	if (!currentUser || !currentUser.is_admin) {
		return { status: 403, error: 'forbidden: admin access required' };
	}

	if (currentUser.user_id === id) {
		return { status: 400, error: 'cannot delete your own account from the admin panel' };
	}

	const db = await getDB();
	const user = await db.getUserById(id);
	if (!user) {
		return { status: 404, error: 'user not found' };
	}

	// Delete user's pastes
	await db.deletePastesByAuthorId(id);

	// Delete user's refresh tokens
	await db.deleteRefreshTokensByUserId(id);

	// Delete user
	await db.deleteUser(id);

	return { status: 200, data: { message: 'user and their pastes deleted successfully' } };
}

export async function listPastes(url: URL, currentUser: any) {
	if (!currentUser || !currentUser.is_admin) {
		return { status: 403, error: 'forbidden: admin access required' };
	}

	const limitVal = url.searchParams.get('limit');
	const offsetVal = url.searchParams.get('offset');
	const search = url.searchParams.get('search') || undefined;

	let limit = parseInt(limitVal || '', 10);
	if (isNaN(limit) || limit <= 0 || limit > 100) {
		limit = 20;
	}

	let offset = parseInt(offsetVal || '', 10);
	if (isNaN(offset) || offset < 0) {
		offset = 0;
	}

	const db = await getDB();
	const result = await db.listAllPastesAdmin(limit, offset, search);

	// Map Dates to strings for JSON serialisation
	const responsePastes = result.pastes.map(p => ({
		...p,
		created_at: p.created_at.toISOString(),
		updated_at: p.updated_at.toISOString(),
		expires_at: p.expires_at ? p.expires_at.toISOString() : null
	}));

	return { status: 200, data: { pastes: responsePastes, total: result.total } };
}
