export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">My Stats</h2>
                    <p className="text-gray-600">You have no pending tasks.</p>
                </div>
                {/* Placeholder content */}
            </div>
        </div>
    );
}
