const jwt = require("jsonwebtoken");

exports.identifier = (req, res, next) => {
  let token;

  // Check if the request is coming from a non-browser client
  if (req.headers.client === "not-browser") {
    // If it's a non-browser client (e.g., Postman, mobile app),
    // retrieve the token from the Authorization header
    token = req.headers.authorization;
  } else {
    // Otherwise, if it's a browser request,
    // retrieve the token from the cookies (usually set as 'Authorization')
    token = req.cookies["Authorization"];
  }

  if (!token) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    const userToken = token.split(" ")[1];
    const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);
    if (jwtVerified) {
      // Attach the decoded JWT payload (which typically contains user details like id, email, role, etc.)
      // to the request object under the 'user' key. This makes authenticated user information available
      // to all subsequent middleware and route handlers in the request/response cycle.
      // For example, after this line, you can access the user's ID anywhere using `req.user.id`.
      // This is a common technique in Express apps for maintaining user identity across protected routes.
      req.user = jwtVerified;
      next();
    } else {
      throw new Error("error in the token");
    }
  } catch (error) {
    console.log(error);
  }
};
