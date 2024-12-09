async function retrieve() {
  const searchValue = document.getElementById("searchBar").value;
  const response = await fetch('http://localhost:3000/movies');
  const movies = await response.json();

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchValue.toLowerCase())
  );

  const content = document.getElementById("content");
  content.style.display = "flex"
  content.innerHTML = "";

  filteredMovies.forEach(movie => {
    const movieDiv = document.createElement("div");
    movieDiv.className = "movie";

    movieDiv.innerHTML = `
      <div class="movie-header">
        <h2>${movie.title}</h2>
      </div>
      <div class="movie-details">
        <p><strong>Year Released: </strong>${movie.year}</p>
        <p><strong>Genre: </strong>${movie.genres.join(', ')}</p>
        <p><strong>Cast: </strong>${movie.cast.join(', ')}</p>
        <p><strong>Description:</strong><br>${movie.extract}</p>
      </div>
     <div class="movie-ratings">
        <h3>Ratings and Comments:</h3>
        <ul>
        ${movie.ratings?.map(r => {
      const loggedInUser = document.cookie
        .split("; ")
        .find(row => row.startsWith("username="))
        ?.split("=")[1];

      return `
            <li>
              ${r.user} comments: <br> ${r.comment} <br> ${r.rating}/5 <br>
              ${r.user === loggedInUser
          ? `<button class="delete-btn" onclick="deleteComment('${movie.title}', '${r.comment}')"><i class="fa fa-trash-o"></i></button>`
          : ""}
            </li>
          `;
    }).join("") || "<li>No ratings yet.</li>"}
      </ul>
      </div>
      <div class="movie-submitRate">
          <form onsubmit="submitRating(event, '${movie.title}')">
              <input type="number" name="rating" min="1" max="5" placeholder="Rate (1-5)" required>
              <textarea name="comment" placeholder="Add a comment" required></textarea>
              <button type="submit">Submit</button>
          </form>
      </div>`;
    content.appendChild(movieDiv);
  });
}

function isLogged() {
  const cookies = document.cookie.split("; ").find(row => row.startsWith("loggedIn="));
  const isLoggedIn = cookies && cookies.split("=")[1] === "true";
  if (!isLoggedIn) {
    showLogin()
    return false
  }
  return true
}


async function submitRating(event, title) {
  event.preventDefault();
  if (!isLogged()) {
    return;
  }

  const form = event.target;
  const rating = form.rating.value;
  const comment = form.comment.value;
  const username = document.cookie.split("; ").find(row => row.startsWith("username="))?.split("=")[1];
  await fetch('http://localhost:3000/rate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, username, rating, comment }),
  });
  retrieve(); // Refresh the list
}

async function showLogin() {
  document.getElementById("registerModal").style.display = "none"
  document.getElementById("loginModal").style.display = "flex"
}

function showRegister() {
  document.getElementById("loginModal").style.display = "none"
  document.getElementById("registerModal").style.display = "flex"
}

async function login() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    // Fetch all users
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }), // Send credentials to the backend
    });
    if (response.ok) {
      const result = await response.json();

      if (result.success) {
        alert("Login successful!");
        document.cookie = "loggedIn=true; path=/; max-age=3600"; // Set login cookie
        document.cookie = `username=${username}; path=/; max-age=3600`; // Set login cookie
        document.getElementById("loginModal").style.display = "none"; // Hide modal
      } else {
        alert("Invalid username or password. Please try again.");
      }
    } else {
      throw new Error("Login request failed.");
    }
  } catch (error) {
    console.error("Error during login:", error);
    alert("An error occurred. Please try again.");
  }
}

async function register() {
  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;

  try {
    // Make a POST request to the /register endpoint
    const response = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }), // Send username and password to backend
    });
    console.log(username, password)
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        alert(result.message); // Show success message
        showLogin(); // Switch to the login modal
      } else {
        alert("Something Wrong");
      }
    } else {
      throw new Error("Register request failed.");
    }
  } catch (error) {
    console.error("Error during registration:", error);
    alert("An error occurred. Please try again.");
  }
}

async function deleteComment(title, comment) {
  const username = document.cookie.split("; ")
    .find(row => row.startsWith("username="))
    ?.split("=")[1]; // Extract logged-in user's username

  try {
    const response = await fetch("http://localhost:3000/deleteComment", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, username, comment }),
    });

    if (response.ok) {
      alert("Comment deleted successfully!");
      retrieve(); // Refresh the movie list
    } else {
      const result = await response.json();
      alert(result.message || "Failed to delete comment.");
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
    alert("An error occurred. Please try again.");
  }
}

