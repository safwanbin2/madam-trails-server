require("dotenv").config();
const express = require('express');
const cors = require('cors');


const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mogpxeu.mongodb.net/?retryWrites=true&w=majority`;

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


app.get("/", (req, res) => {
    res.send("server is running fine");
})

function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();
        console.log("mongodb connected successfully");

        // collections
        const UsersCollection = client.db("WorkingTitle").collection("users");
        const ProductsCollection = client.db("WorkingTitle").collection("products");
        const WishlistsCollection = client.db("WorkingTitle").collection("wishlist");
        const CartsCollection = client.db("WorkingTitle").collection("cart");
        const MessagesCollection = client.db("WorkingTitle").collection("messages");
        const BlogsCollection = client.db("WorkingTitle").collection("blogs");
        const OrdersCollection = client.db("WorkingTitle").collection("orders");

        // posting users
        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const filter = { email: newUser.email };
            const exist = await UsersCollection.findOne(filter);
            if (exist) {
                return res.send({ status: 'false', message: "User already exists" });
            }
            const result = await UsersCollection.insertOne(newUser);
            res.send(result);
        }
        )
        // getting all the users or the admins
        app.get("/users/all", async (req, res) => {
            const role = req.query.role;
            const filter = { role: role };
            const cursor = UsersCollection.find(filter);
            const result = (await cursor.toArray()).reverse();
            res.send(result);
        })
        // getting an specific user for loading myprofile and contxt
        app.get('/users/myprofile', async (req, res) => {
            const email = req.query.email;
            const filter = { email: email };
            const result = await UsersCollection.findOne(filter);
            res.send(result);
        })
        // updating user {phone, location} from myprofile
        app.put("/users/myprofile", async (req, res) => {
            const email = req.query.email;
            const info = req.body;
            const filter = { email: email };
            const updatedDocument = {
                $set: {
                    phone: info.phone,
                    location: info.location
                }
            };
            const options = { upsert: true };
            const result = await UsersCollection.updateOne(filter, updatedDocument, options);
            res.send(result);
        })
        // getting to know if the user is admin or not.
        // useAdmin call
        app.get("/users/isadmin", async (req, res) => {
            const email = req.query.email;
            const filter = { email: email };
            const user = await UsersCollection.findOne(filter);
            if (user?.role === "admin") {
                return res.send({ isAdmin: true });
            }
            res.send({ isAdmin: false })
        })
        // adding products from admin dashboard
        app.post("/products/add", async (req, res) => {
            const newProduct = req.body;
            const result = await ProductsCollection.insertOne(newProduct);
            res.send(result);
        })
        // getting all the products for admin p list
        app.get("/products/all", async (req, res) => {
            const filter = {};
            const cursor = ProductsCollection.find(filter);
            const result = (await cursor.toArray()).reverse();
            res.send(result);
        })
        // getting categorized products
        app.get("/products/categories", async (req, res) => {
            const category = req.query.category;
            const filter = { category: category };
            const cursor = ProductsCollection.find(filter);
            const result = (await cursor.toArray()).reverse();
            res.send(result);
        })
        // finding products on search
        app.get("/products/find", async (req, res) => {
            const searchText = req.query.q;
            const categoryText = req.query.category;
            const filter = {
                title: {
                    $regex: searchText,
                    $options: "i"
                },
            };
            if (categoryText) {
                filter.category = categoryText
            }
            const cursor = ProductsCollection.find(filter);
            const result = (await cursor.toArray()).reverse();
            res.send(result);
        })
        // getting / finding single product by the id
        app.get("/product/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await ProductsCollection.findOne(filter);
            res.send(result);
        })
        // deleting specific product by id from admin dashboard
        app.delete("/products/delete/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await ProductsCollection.deleteOne(filter);
            if (result.deletedCount) {
                const query = { productId: id };
                await CartsCollection.deleteMany(query);
                await WishlistsCollection.deleteMany(query);
            }
            res.send(result);
        })
        // patching or upadting isBoosted status
        app.put("/products/boosted", async (req, res) => {
            const id = req.query.id;
            const isBoosted = req.query.isBoosted;
            let status;
            if (isBoosted === "true" || true) {
                status = true
            }
            if (isBoosted === "false" || false) {
                status = false
            }
            const filter = { _id: new ObjectId(id) };
            const updateDocumnets = {
                $set: {
                    isBoosted: status
                }
            };
            const updateOptions = {
                upsert: true
            };
            const result = await ProductsCollection.updateOne(filter, updateDocumnets, updateOptions);
            res.send(result);
        })
        // getting all the boosted products
        app.get("/products/boosted", async (req, res) => {
            const limit = parseInt(req.query.limit);
            const filter = { isBoosted: true };
            const cursor = ProductsCollection.find(filter);
            const result = (await cursor.toArray()).reverse();
            if (result.length > limit) {
                return res.send(result.slice(0, limit));
            }
            res.send(result);
        })
        // adding / posting to wishlist
        app.post("/wishlist", async (req, res) => {
            const wishlistItem = req.body;
            const filter = {
                productId: wishlistItem.productId,
                buyerEmail: wishlistItem.buyerEmail
            };
            const exist = await WishlistsCollection.findOne(filter);
            if (exist) {
                return res.send({ success: false, message: "Item Already added to the wishlist" })
            }
            const result = await WishlistsCollection.insertOne(wishlistItem, { upsert: true });
            res.send({ success: true, message: "Item Added to Wishlist", result });
        })
        // getting user specific wishlist items count
        app.get("/wishlist/mycount", async (req, res) => {
            const email = req.query.email;
            const filter = { buyerEmail: email };
            const cursor = WishlistsCollection.find(filter);
            const result = (await cursor.toArray()).length;
            res.send({ count: result })
        });
        // getting user specific wishlist items by email
        app.get("/wishlist/mywishlist", async (req, res) => {
            const email = req.query.email;
            const filter = { buyerEmail: email };
            const cursor = WishlistsCollection.find(filter);
            const result = (await cursor.toArray()).reverse();
            res.send(result);
        })
        // removing item from wishlist
        app.delete("/wishlist/delete", async (req, res) => {
            const id = req.query.id;
            const filter = { _id: new ObjectId(id) };
            const result = await WishlistsCollection.deleteOne(filter);
            res.send(result);
        })
        // cart items functions
        // posting to cart
        app.post("/cart/additem", async (req, res) => {
            const newItem = req.body;
            const filter = {
                buyerId: newItem.buyerId,
                productId: newItem.productId
            };
            const exist = await CartsCollection.findOne(filter);
            if (!exist) {
                const result = await CartsCollection.insertOne(newItem);
                return res.send(result);
            }
            const updatedDocument = {
                $inc: {
                    quantity: parseInt(newItem.quantity)
                },
                $set: {
                    reference: newItem.reference
                }
            }
            const options = { upsert: true };
            const result = await CartsCollection.updateOne(filter, updatedDocument, options);
            res.send(result);
        });
        // getting user specific cart items
        app.get("/cart/mycart", async (req, res) => {
            const email = req.query.email;
            const filter = { buyerEmail: email };
            const cursor = CartsCollection.find(filter);
            const result = (await cursor.toArray()).reverse();
            res.send(result);
        })
        // cart / order summary
        app.get("/cart/mycart/summary", async (req, res) => {
            let subTotalItems = 0;
            let subTotalPrice = 0;
            let shippingFee = 0;

            const email = req.query.email;
            const filter = { buyerEmail: email };
            const cursor = CartsCollection.find(filter);
            const cartItems = await cursor.toArray();
            if (cartItems.length) {
                shippingFee = 50;
            }
            cartItems.forEach(item => {
                const tItems = item.quantity;
                const tPrice = item.productPrice * tItems;
                subTotalPrice = subTotalPrice + tPrice;
                subTotalItems = subTotalItems + tItems;
            });

            let totalPrice = subTotalPrice + shippingFee;
            res.send({
                subTotalItems,
                subTotalPrice,
                totalPrice,
                shippingFee
            })
        })
        // getting user specific cart items count
        app.get("/cart/mycount", async (req, res) => {
            const email = req.query.email;
            const filter = { buyerEmail: email };
            const cursor = CartsCollection.find(filter);
            const result = (await cursor.toArray()).length;
            res.send({ count: result })
        });
        // removing item from cart
        app.delete("/cart/delete", async (req, res) => {
            const id = req.query.id;
            const filter = { _id: new ObjectId(id) };
            const result = await CartsCollection.deleteOne(filter);
            res.send(result);
        })
        //posting messages to the collection
        app.post("/messages/newmessage", async (req, res) => {
            try {
                const newMessage = req.body;
                const result = await MessagesCollection.insertOne(newMessage);
                res.send(result);
            } catch (error) {
                console.log(error);
            }
        })

        // getting all the messages
        app.get("/messages/all", async (req, res) => {
            try {
                const filter = {};
                const cursor = MessagesCollection.find(filter);
                const result = (await cursor.toArray()).reverse();
                res.send(result);
            } catch (error) {
                console.log(error);
            }
        })

        // deleting mmessages autometically after 7days
        setInterval(async () => {
            const d = new Date();
            const currentDate = d.getDate();
            const filter = { expiryDate: currentDate };

            const result = await MessagesCollection.deleteMany(filter);
        }, 86400000);

        // blogs
        // adding new blogs from admin dashboard
        app.post("/blogs/add", async (req, res) => {
            const newPost = req.body;
            const result = await BlogsCollection.insertOne(newPost);
            res.send(result);
        })
        // getting all of the blog post
        app.get("/blogs/all", async (req, res) => {
            const filter = {};
            const cursor = BlogsCollection.find(filter);
            const result = (await cursor.toArray()).reverse();
            res.send(result);
        })
        // getting blogs posts according category
        app.get("/blogs", async (req, res) => {
            const category = req.query.category;
            const filter = { category: category };
            const cursor = BlogsCollection.find(filter);
            const result = (await cursor.toArray()).reverse();
            res.send(result);
        });
        // getting a single blog post according to it's id
        app.get("/blogs/blog/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await BlogsCollection.findOne(filter);
            res.send(result);
        });
        // deleting a specific clog by id
        app.delete("/blogs/delete", async (req, res) => {
            const id = req.query.id;
            const filter = { _id: new ObjectId(id) };
            const result = await BlogsCollection.deleteOne(filter);
            res.send(result)
        });




        // !importtant orders
        app.post("/orders/placeorder", async (req, res) => {
            const order = req.body;
            const cartItems = await CartsCollection.find({ buyerEmail: req.query.email }).toArray();
            order.products = cartItems;

            const result = await OrdersCollection.insertOne(order);
            if (result.insertedId || result.acknowledged) {
                await CartsCollection.deleteMany({ buyerEmail: req.query.email });
            }
            res.send(result);
        });

        // !deleting orders that are delivered
        app.delete("/orders/delete", async (req, res) => {
            const id = req.query.id;
            const filter = { _id: new ObjectId(id) };
            const result = await OrdersCollection.deleteOne(filter);
            res.send(result);
        })

        // !getting user specific order by querying with email without delivered items
        app.get("/orders/myorders", async (req, res) => {
            const email = req.query.email;
            const filter = {
                buyerEmail: email,
                status: {
                    $ne: "delivered"
                }
            };
            const cursor = OrdersCollection.find(filter);
            const result = (await cursor.toArray()).reverse();
            res.send(result);
        });

        //! getting user specific orders by querying with email, only delivered items,called from profle-recieved section
        app.get("/orders/myorders/delivered", async (req, res) => {
            const email = req.query.email;
            const filter = {
                buyerEmail: email,
                status: "delivered"
            };
            const cursor = OrdersCollection.find(filter);
            const result = (await cursor.toArray()).reverse();
            res.send(result);
        })

        // !getting specific id order with id query
        app.get("/orders/myorders/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await OrdersCollection.findOne(filter);
            res.send(result);
        })

        // !getting orders as their status from admin panel
        app.get("/orders/all", async (req, res) => {
            const orderStatus = req.query.orderstatus;
            const filter = { status: orderStatus };
            const cursor = OrdersCollection.find(filter);
            const result = (await cursor.toArray()).reverse();
            res.send(result);
        })

        // !updating order status by admin from admin panel
        app.put("/orders/updatestatus", async (req, res) => {
            const id = req.query.id;
            const status = req.query.status;
            const filter = { _id: new ObjectId(id) };
            const updatedDocuments = {
                $set: {
                    status: status
                }
            }
            const options = { upsert: true }

            const result = await OrdersCollection.updateOne(filter, updatedDocuments, options);
            res.send(result);
        });


    }
    catch (err) {
        console.log(err);
    }
}
run()

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
})