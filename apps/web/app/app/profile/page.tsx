"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
    const { user } = useAuth();

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">My Profile</h1>
            <div className="bg-white p-6 rounded-lg shadow max-w-lg">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1 text-lg">{user?.fullName}</div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 text-lg">{user?.email}</div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1 text-lg">{user?.isSuperAdmin ? "Super Admin" : "User"}</div>
                </div>
            </div>
        </div>
    );
}
