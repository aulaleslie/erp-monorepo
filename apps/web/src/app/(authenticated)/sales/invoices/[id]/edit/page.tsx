export default function EditSalesInvoicePage({ params }: { params: { id: string } }) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Edit Sales Invoice</h1>
            <div className="p-4 border rounded shadow bg-white">
                <p>Edit form for invoice ID: {params.id}</p>
            </div>
        </div>
    );
}
