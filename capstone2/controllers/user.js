const User = require("../models/User");
const bcrypt = require("bcrypt");
const auth = require("../auth");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");

module.exports.registerUser = (req, res) => {
  const { firstName, lastName, email, isAdmin, password, mobileNo } = req.body;

  if (!firstName || !lastName || !email || !password || !mobileNo) {
    return res.status(400).send({ error: "All fields must be provided" });
  }

  return User.findOne({ email })
    .then((result) => {
      if (result != null && result.email == email) {
        return res.status(400).send({ error: "Duplicate email found" });
      }

      if (mobileNo.length !== 11) {
        return res.status(400).send({ error: "Enter 11 digit mobile number" });
      }

      if (!email.includes("@")) {
        return res.status(400).send({ error: "Email invalid, no @ symbol" });
      }

      if (password.length < 8) {
        return res.status(400).send({ error: "Password should be greater than 8 characters" });
      }

      const newUser = new User({
        firstName,
        lastName,
        email,
        isAdmin,
        password: bcrypt.hashSync(password, 10),
        mobileNo,
      });

      return newUser
        .save()
        .then((user) => res.status(201).send({ message: "Registered Successfully" }))
        .catch((err) => {
          console.error("Register Error", err);
          return res.status(500).send({ error: "Failed to register" });
        });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).send({ error: "Internal Server Error" });
    });
};


module.exports.loginUser = (req, res) => {
  return User.findOne({ email: req.body.email })
    .then((result) => {
      if (result == null) {
        return res.status(404).send({ error: "No Email Found" });
      } else {
        const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);
        if (isPasswordCorrect == true) {
          const accessToken = auth.createAccessToken(result);
          return res.status(200).send({ message: "Login Successful", access: accessToken });
        } else {
          return res.status(401).send({ message: "Email and/or password do not match" });
        }
      }
    })
    .catch((err) => {
      console.error("Error in logging in", err);
      return res.status(500).send({ error: "Failed to login" });
    });
};


module.exports.getProfile = (req,res) => {
	console.log(req.user);
	return User.findById(req.user.id)
	.then(user =>{
		if(!user){
			return res.status(404).send({error: 'User not found'});

		} else {
			user.password = "******";
			return res.status(200).send({user})
		}
	})
	.catch(err => {
		console.error("Error in getting the profile", err);
		return res.status(500).send({error: "Failed to fetch profile"});
	})
}


module.exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body; 
    const { id } = req.user; 

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(id, { password: hashedPassword });

   
    res.status(200).send({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
};


module.exports.updateUserToAdmin = (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).send({ error: "User ID is required." });
  }

  User.findByIdAndUpdate(userId, { isAdmin: true })
    .then((updatedUser) => {
      if (!updatedUser) {
        return res.status(404).send({ error: "User not found." });
      }

      return res.status(200).send({ message: "User updated to admin successfully." });
    })
    .catch((err) => {
      console.error("Error updating user to admin", err);
      return res.status(500).send({ error: "Internal Server Error" });
    });
};


module.exports.getUsersCart = (req, res) => {
  console.log(req.user);
  return Cart.find({ userId: req.user.id })
    .then((YourCart) => {
      if (!YourCart || YourCart.length === 0 || !YourCart[0].cartItems || YourCart[0].cartItems.length === 0) {
        return res.status(404).send({ error: 'No items in your cart. Please add now.' });
      } else {
        return res.status(200).send({ YourCart });
      }
    })
    .catch((err) => {
      console.error("Error in getting your cart", err);
      return res.status(500).send({ error: "Failed to fetch cart" });
    });
};


// module.exports.addToCart = async (req, res) => {
//   // Ensure that req.user is available and contains the user's information
//   if (!req.user) {
//     return res.status(401).send('Unauthorized');
//   }

//   const { cartItems } = req.body;
//   const userId = req.user.id; // Use the user ID from the token

//   try {
//     // Check if the user already has a cart
//     let existingCart = await Cart.findOne({ userId });

//     if (existingCart) {
//       // Iterate over each item in cartItems
//       for (const newItem of cartItems) {
//         // Check if the product already exists in the cart
//         const existingCartItemIndex = existingCart.cartItems.findIndex(
//           (item) => item.productId === newItem.productId
//         );

//         if (existingCartItemIndex !== -1) {
//           // If the product already exists, update quantity and subtotal
//           existingCart.cartItems[existingCartItemIndex].quantity += newItem.quantity;
//           existingCart.cartItems[existingCartItemIndex].subtotal += newItem.subtotal;
//         } else {
//           // If the product does not exist, add it to the cart
//           existingCart.cartItems.push(newItem);
//         }
//       }

//       // Calculate the updated total price based on individual quantity and subtotal values
//       existingCart.totalPrice = existingCart.cartItems.reduce(
//         (total, item) => total + item.subtotal,
//         0
//       );

//       // Save the updated cart
//       const updatedCart = await existingCart.save();

//       return res.status(200).json(updatedCart);
//     } else {
//       // If the user doesn't have a cart, create a new cart
//       const totalPrice = cartItems.reduce((total, item) => total + item.subtotal, 0);
//       const newCart = new Cart({
//         userId,
//         cartItems,
//         totalPrice,
//       });

//       const savedCart = await newCart.save();
//       return res.status(201).json(savedCart);
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).send('Internal Server Error');
//   }
// };


module.exports.addToCart = async (req, res) => {
  // Ensure that the request includes the user's information
  if (!req.user) {
    return res.status(401).send('Unauthorized');
  }

  const { cartItems } = req.body;
  const userId = req.user.id; // Retrieve the user ID from the authentication token

  try {
    // Check if the user already has a cart
    let existingCart = await Cart.findOne({ userId });

    if (existingCart) {
      // Iterate over each item in the cartItems array
      for (const newItem of cartItems) {
        // Fetch product details from the database based on productId
        const product = await Product.findById(newItem.productId);

        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }

        // Check if the product already exists in the cart
        const existingCartItemIndex = existingCart.cartItems.findIndex(
          (item) => item.productId === newItem.productId
        );

        if (existingCartItemIndex !== -1) {
          // If the product already exists, update quantity and recalculate subtotal
          existingCart.cartItems[existingCartItemIndex].quantity += newItem.quantity;
          existingCart.cartItems[existingCartItemIndex].subtotal =
            existingCart.cartItems[existingCartItemIndex].quantity * product.price;
        } else {
          // If the product does not exist, add it to the cart
          existingCart.cartItems.push({
            productId: newItem.productId,
            quantity: newItem.quantity,
            subtotal: newItem.quantity * product.price,
          });
        }
      }

      // Calculate the updated total price based on individual quantity and subtotal values
      existingCart.totalPrice = existingCart.cartItems.reduce(
        (total, item) => total + item.subtotal,
        0
      );

      // Save the updated cart with explicit validation
      const updatedCart = await existingCart.save();

      // Return success message
      return res.status(200).json({ message: 'Items added to the cart successfully', cart: updatedCart });
    } else {
      // If the user doesn't have a cart, create a new cart
      const totalPrice = await calculateTotalPrice(cartItems);
      const newCart = new Cart({
        userId,
        cartItems: await calculateCartItems(cartItems),
        totalPrice,
      });

      // Save the new cart with explicit validation
      const savedCart = await newCart.save();

      // Return success message
      return res.status(201).json({ message: 'Items added to the cart successfully', cart: savedCart });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
};

module.exports.updateCartItem = async (req, res) => {
  // Ensure that req.user is available and contains the user's information
  if (!req.user) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id; // Use the user ID from the token

    console.log('Updating cart item:', userId, productId);

    const existingCartItem = await Cart.findOne({
      userId,
      'cartItems.productId': productId,
    });

    if (existingCartItem) {
      // If the item already exists, find the index of the product in cartItems
      const updatedItemIndex = existingCartItem.cartItems.findIndex(
        (item) => item.productId === productId
      );

      const existingQuantity = existingCartItem.cartItems[updatedItemIndex].quantity;

      // Fetch product details from the database based on productId
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Calculate subtotal based on the given quantity and product price
      const newSubtotal = quantity * product.price;

      // Check if quantity or the new subtotal is different from existing values
      if (existingQuantity !== quantity || existingCartItem.cartItems[updatedItemIndex].subtotal !== newSubtotal) {
        // Reset total price to the initial value
        existingCartItem.totalPrice = existingCartItem.totalPrice - existingCartItem.cartItems[updatedItemIndex].subtotal;

        // Update quantity and subtotal for the specific item
        existingCartItem.cartItems[updatedItemIndex].quantity = quantity;
        existingCartItem.cartItems[updatedItemIndex].subtotal = newSubtotal;

        // Update total price by adding the new subtotal
        existingCartItem.totalPrice += newSubtotal;

        // Save the updated cart
        const updatedQuantity = await existingCartItem.save();

        console.log('Updated user:', updatedQuantity);
        return res.send({ message: 'Here is your updated cart', updatedQuantity });
      } else {
        // If quantity and subtotal are the same, just return the existing cart
        console.log('No changes in quantity or subtotal, returning existing cart.');
        return res.send({ message: 'No changes in quantity or subtotal', existingCartItem });
      }
    } else {
      // If the item doesn't exist, add it to cartItems
      // Fetch product details from the database based on productId
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Calculate subtotal based on the given quantity and product price
      const subtotal = quantity * product.price;

      const newItem = {
        productId,
        quantity,
        subtotal,
      };

      // Update total price by adding the new subtotal
      const totalChange = subtotal;
      const updatedUserWithNewItem = await Cart.findOneAndUpdate(
        { userId },
        {
          $push: {
            cartItems: newItem,
          },
          $inc: {
            totalPrice: totalChange,
          },
        },
        {
          new: true,
        }
      );

      console.log('Updated user:', updatedUserWithNewItem);
      return res.send({
        message: 'Item added to cart',
        updatedUser: updatedUserWithNewItem,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports.clearCartItems = async (req, res) => {
  try {
    const { id: userId } = req.user; // Use destructuring to get the 'id' property from req.user

    console.log(`Clearing the cart for user ${userId}`);

    const userBeforeUpdate = await Cart.findOne({ userId });
    console.log('Cart before update:', userBeforeUpdate);

    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      {
        $set: {
          'cartItems': [],
          totalPrice: 0,
        },
      },
      { new: true }
    );

    console.log('Updated user:', updatedCart);

    if (!updatedCart) {
      return res.status(404).send({ error: 'User not found' });
    }

    res.send({ message: 'Cart items cleared', updatedCart });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    console.log(`Removing product ${productId} from the cart for user ${userId}`);

    const userBeforeUpdate = await Cart.findOne({ userId });
    console.log('Cart before update:', userBeforeUpdate);

    // Find the item to be removed
    const itemToRemove = userBeforeUpdate.cartItems.find(item => item.productId === productId);

    if (!itemToRemove) {
      return res.status(404).send({ error: 'Product not found in the cart' });
    }

    // Remove the item and update the total price
    const updatedCartItems = await Cart.findOneAndUpdate(
      { userId },
      {
        $pull: {
          'cartItems': { productId },
        },
        $inc: {
          'totalPrice': -itemToRemove.subtotal,
        },
      },
      { new: true }
    );

    console.log('Updated user:', updatedCartItems);

    if (!updatedCartItems) {
      return res.status(404).send({ error: 'User not found' });
    }

    res.send({ message: `Product removed from the cart successfully`, updatedCartItems });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).send({ message: "No cart found for the current user" });
        }

        if (cart.cartItems.length === 0) {
            return res.status(400).send({ message: "No items in the cart" });
        }

        // Check if an order with the same userId and productsOrdered already exists
        const existingOrder = await Order.findOne({
            userId: userId,
            productsOrdered: cart.cartItems,
        });

        if (existingOrder) {
            return res.status(409).send({ message: "Duplicate order detected. The same order already exists." });
        }

        const newOrder = new Order({
            userId: userId,
            productsOrdered: cart.cartItems,
            totalPrice: cart.totalPrice,
        });

        const yourOrder = await newOrder.save();

        return res.status(201).send({
            message: "Order created successfully",
            yourOrder,
        });
    } catch (err) {
        return res.status(500).send(err);
    }
};


module.exports.getMyOrder = (req, res) => {
  console.log(req.user);  
  return Order.find({ userId: req.user.id })
    .then((yourOrder) => {
      if (!yourOrder || yourOrder.length === 0) {
        
        return res.status(404).send({ error: 'No items in your order. Please add now.' });
      } else {
        
        return res.status(200).send({ yourOrder });
      }
    })
    .catch((err) => {
      
      console.error("Error in getting your order", err);
      return res.status(500).send({ error: "Failed to fetch order" });
    });
};


module.exports.getAllOrders = (req, res) => {
  return Order.find({})
  .then(allOrder => { res.status(200).send({allOrder}) })
  .catch(err => res.status(500).send({error: "Error finding all orders"}) );
};


module.exports.updateOrderStatus = async (req, res) => {
    try {
        // Check if the user making the request is an admin
        if (!req.user.isAdmin) {
            return res.status(403).send({ error: "Unauthorized. Only admin users can update order status." });
        }

        const { orderId } = req.params;

        // Check if orderId is provided
        if (!orderId) {
            return res.status(400).send({ error: "Order ID is required." });
        }

        // Find and update the order status
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: "Done" }, { new: true });

        if (!updatedOrder) {
            return res.status(404).send({ error: "Order not found." });
        }

        return res.status(200).send({ message: "Order status updated to 'Done' successfully.", updatedOrder });
    } catch (err) {
        console.error("Error updating order status to 'Done'", err);
        return res.status(500).send({ error: "Internal Server Error" });
    }
};



