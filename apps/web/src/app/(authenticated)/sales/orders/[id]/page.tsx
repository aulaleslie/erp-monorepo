export default function SalesOrderDetailPage({ params }: { params: { id: string } }) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Sales Order Details</h1>
            <div className="p-4 border rounded shadow bg-white">
                <p>Details for order ID: {params.id}</p>
            </div>
        </div>
    );
}
