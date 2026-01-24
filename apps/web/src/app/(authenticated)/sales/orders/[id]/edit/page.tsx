export default function EditSalesOrderPage({ params }: { params: { id: string } }) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Edit Sales Order</h1>
            <div className="p-4 border rounded shadow bg-white">
                <p>Edit form for order ID: {params.id}</p>
            </div>
        </div>
    );
}
