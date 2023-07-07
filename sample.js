const demo = {
    _id: ObjectId("order_id"),
    products: [
        {
            _id: ObjectId("product_id1"),
            name: "Product 1",
            quantity: 2,
            price: 10.99
        },
        {
            _id: ObjectId("product_id2"),
            name: "Product 2",
            quantity: 1,
            price: 24.99
        }
        // Additional product objects can be added here
    ],
    paymentMethod: "COD", // Can be "COD" or "Paid"
    status: "Pending", // Can be "Pending", "Paid", "Picked", "On Delivery", etc.
    createdAt: ISODate("2023-07-07T00:00:00Z"), // Timestamp when the order was created
    updatedAt: ISODate("2023-07-07T12:34:56Z"), // Timestamp when the order was last updated
    tracking: [
        {
            status: "Paid",
            timestamp: ISODate("2023-07-07T12:34:56Z")
        },
        {
            status: "Picked",
            timestamp: ISODate("2023-07-07T13:45:00Z")
        },
        {
            status: "On Delivery",
            timestamp: ISODate("2023-07-07T14:30:00Z")
        }
        // Additional tracking status objects can be added here
    ]
}