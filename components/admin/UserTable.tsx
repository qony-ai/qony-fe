interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function UserTable({ users }: { users: AdminUser[] }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-emerald-200/10 bg-emerald-300/6">
      <table className="min-w-full text-left text-sm text-white/72">
        <thead className="bg-[#0c3b30]/70 text-white/44">
          <tr>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr className="border-t border-emerald-200/10" key={user.id}>
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">{user.name}</td>
              <td className="px-4 py-3">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
