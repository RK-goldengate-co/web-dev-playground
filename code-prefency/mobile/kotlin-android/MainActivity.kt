// Kotlin Android Activity
package com.example.usermanagement

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.gson.Gson
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException

// Data classes
data class User(
    val id: Int,
    val name: String,
    val email: String,
    val role: String,
    val isActive: Boolean,
    val createdAt: String,
    val preferences: Map<String, Any>
)

data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: String?,
    val message: String?
)

// User adapter for RecyclerView
class UserAdapter(private val users: MutableList<User>) : RecyclerView.Adapter<UserAdapter.UserViewHolder>() {

    class UserViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val nameTextView: TextView = itemView.findViewById(R.id.userName)
        val emailTextView: TextView = itemView.findViewById(R.id.userEmail)
        val roleTextView: TextView = itemView.findViewById(R.id.userRole)
        val activeSwitch: Switch = itemView.findViewById(R.id.activeSwitch)
        val deleteButton: Button = itemView.findViewById(R.id.deleteButton)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UserViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.user_item, parent, false)
        return UserViewHolder(view)
    }

    override fun onBindViewHolder(holder: UserViewHolder, position: Int) {
        val user = users[position]
        holder.nameTextView.text = user.name
        holder.emailTextView.text = user.email
        holder.roleTextView.text = user.role.capitalize()
        holder.activeSwitch.isChecked = user.isActive

        holder.activeSwitch.setOnCheckedChangeListener { _, isChecked ->
            // Update user active status
            updateUserStatus(user.id, isChecked)
        }

        holder.deleteButton.setOnClickListener {
            deleteUser(user.id, position)
        }
    }

    override fun getItemCount() = users.size

    private fun updateUserStatus(userId: Int, isActive: Boolean) {
        // API call to update user status
        Log.d("UserAdapter", "Updating user $userId to active: $isActive")
    }

    private fun deleteUser(userId: Int, position: Int) {
        // API call to delete user
        users.removeAt(position)
        notifyItemRemoved(position)
        Log.d("UserAdapter", "Deleted user $userId")
    }
}

// Main Activity
class MainActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var userAdapter: UserAdapter
    private lateinit var progressBar: ProgressBar
    private lateinit var errorTextView: TextView
    private lateinit var retryButton: Button
    private lateinit var addUserButton: Button

    private val users = mutableListOf<User>()
    private val client = OkHttpClient()
    private val gson = Gson()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initializeViews()
        setupRecyclerView()
        loadUsers()

        retryButton.setOnClickListener { loadUsers() }
        addUserButton.setOnClickListener { showAddUserDialog() }
    }

    private fun initializeViews() {
        recyclerView = findViewById(R.id.recyclerView)
        progressBar = findViewById(R.id.progressBar)
        errorTextView = findViewById(R.id.errorTextView)
        retryButton = findViewById(R.id.retryButton)
        addUserButton = findViewById(R.id.addUserButton)
    }

    private fun setupRecyclerView() {
        userAdapter = UserAdapter(users)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = userAdapter
    }

    private fun loadUsers() {
        showLoading()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = makeApiCall("/api/users")
                val apiResponse = gson.fromJson(response, ApiResponse::class.java) as ApiResponse<List<User>>

                withContext(Dispatchers.Main) {
                    if (apiResponse.success && apiResponse.data != null) {
                        users.clear()
                        users.addAll(apiResponse.data)
                        userAdapter.notifyDataSetChanged()
                        showContent()
                    } else {
                        showError(apiResponse.error ?: "Failed to load users")
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    showError("Network error: ${e.message}")
                }
            }
        }
    }

    private fun makeApiCall(endpoint: String): String {
        val request = Request.Builder()
            .url("http://10.0.2.2:8000$endpoint") // Android emulator localhost
            .build()

        return try {
            val response = client.newCall(request).execute()
            response.body?.string() ?: throw IOException("Empty response")
        } catch (e: IOException) {
            throw IOException("Network request failed", e)
        }
    }

    private fun showAddUserDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_add_user, null)
        val nameEditText = dialogView.findViewById<EditText>(R.id.nameEditText)
        val emailEditText = dialogView.findViewById<EditText>(R.id.emailEditText)
        val roleSpinner = dialogView.findViewById<Spinner>(R.id.roleSpinner)

        AlertDialog.Builder(this)
            .setTitle("Add New User")
            .setView(dialogView)
            .setPositiveButton("Add") { _, _ ->
                val name = nameEditText.text.toString().trim()
                val email = emailEditText.text.toString().trim()
                val role = roleSpinner.selectedItem.toString().lowercase()

                if (name.isNotEmpty() && email.isNotEmpty()) {
                    createUser(name, email, role)
                } else {
                    Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun createUser(name: String, email: String, role: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userJson = gson.toJson(mapOf(
                    "name" to name,
                    "email" to email,
                    "role" to role
                ))

                val mediaType = "application/json; charset=utf-8".toMediaType()
                val requestBody = userJson.toRequestBody(mediaType)

                val request = Request.Builder()
                    .url("http://10.0.2.2:8000/api/users")
                    .post(requestBody)
                    .build()

                val response = client.newCall(request).execute()
                val responseBody = response.body?.string()

                withContext(Dispatchers.Main) {
                    if (response.isSuccessful && responseBody != null) {
                        val apiResponse = gson.fromJson(responseBody, ApiResponse::class.java) as ApiResponse<User>
                        if (apiResponse.success && apiResponse.data != null) {
                            users.add(0, apiResponse.data) // Add to beginning
                            userAdapter.notifyItemInserted(0)
                            recyclerView.scrollToPosition(0)
                            Toast.makeText(this@MainActivity, "User created successfully", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(this@MainActivity, apiResponse.error ?: "Failed to create user", Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        Toast.makeText(this@MainActivity, "Failed to create user", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun showLoading() {
        progressBar.visibility = View.VISIBLE
        recyclerView.visibility = View.GONE
        errorTextView.visibility = View.GONE
        retryButton.visibility = View.GONE
    }

    private fun showContent() {
        progressBar.visibility = View.GONE
        recyclerView.visibility = View.VISIBLE
        errorTextView.visibility = View.GONE
        retryButton.visibility = View.GONE
    }

    private fun showError(message: String) {
        progressBar.visibility = View.GONE
        recyclerView.visibility = View.GONE
        errorTextView.visibility = View.VISIBLE
        retryButton.visibility = View.VISIBLE
        errorTextView.text = message
    }
}

// Utility functions
object Utils {
    fun formatDateTime(dateTimeString: String): String {
        // Format date time for display
        return dateTimeString // Simplified for this example
    }

    fun validateEmail(email: String): Boolean {
        return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }

    fun capitalizeFirst(str: String): String {
        return str.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    }
}

// Extension functions
fun String.capitalizeWords(): String {
    return this.split(" ").joinToString(" ") { word ->
        word.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    }
}
