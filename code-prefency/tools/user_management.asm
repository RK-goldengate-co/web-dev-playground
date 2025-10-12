; Assembly language implementation for User Management System
; Low-level system programming example
; Target: x86-64 Linux

section .data
    ; Constants
    MAX_USERS equ 1000
    USER_SIZE equ 264    ; Size of User struct in bytes
    DB_FILE db 'users.db', 0

    ; Messages
    welcome_msg db 'User Management System (Assembly)', 10, 0
    prompt_msg db 'Choose option: ', 0
    user_added_msg db 'User added successfully', 10, 0
    user_not_found_msg db 'User not found', 10, 0
    invalid_input_msg db 'Invalid input', 10, 0

    ; Format strings for printing
    fmt_int db '%d', 10, 0
    fmt_str db '%s', 10, 0
    fmt_user db 'ID: %d, Name: %s, Email: %s, Role: %d, Active: %d', 10, 0

section .bss
    ; User database storage
    users resb MAX_USERS * USER_SIZE
    user_count resd 1
    next_id resd 1

    ; Temporary buffers
    input_buffer resb 256
    temp_buffer resb 256

section .text
    global _start
    extern printf, scanf, fopen, fclose, fwrite, fread, malloc, free, exit

; User struct offsets (for easy access)
%define USER_ID_OFFSET 0
%define USER_NAME_OFFSET 4
%define USER_EMAIL_OFFSET 104
%define USER_ROLE_OFFSET 204
%define USER_ACTIVE_OFFSET 208
%define USER_CREATED_OFFSET 212

_start:
    ; Initialize system
    call init_system

    ; Show welcome message
    push welcome_msg
    call print_string
    add esp, 4

main_loop:
    ; Show menu and get user choice
    call show_menu
    call get_user_choice

    ; Handle user choice
    cmp eax, 1
    je add_user_option
    cmp eax, 2
    je display_users_option
    cmp eax, 3
    je search_users_option
    cmp eax, 4
    je update_user_option
    cmp eax, 5
    je delete_user_option
    cmp eax, 6
    je show_stats_option
    cmp eax, 0
    je exit_program

    ; Invalid option
    push invalid_input_msg
    call print_string
    add esp, 4
    jmp main_loop

add_user_option:
    call add_user
    jmp main_loop

display_users_option:
    call display_users
    jmp main_loop

search_users_option:
    call search_users
    jmp main_loop

update_user_option:
    call update_user
    jmp main_loop

delete_user_option:
    call delete_user
    jmp main_loop

show_stats_option:
    call show_stats
    jmp main_loop

exit_program:
    call cleanup
    mov eax, 1          ; sys_exit
    xor ebx, ebx        ; exit code 0
    int 0x80

; Initialize system
init_system:
    ; Set initial values
    mov dword [user_count], 0
    mov dword [next_id], 1

    ; Load existing data from file
    call load_database
    ret

; Show main menu
show_menu:
    push prompt_msg
    call print_string
    add esp, 4

    ; Print menu options
    push menu_option1
    call print_string
    add esp, 4

    push menu_option2
    call print_string
    add esp, 4

    push menu_option3
    call print_string
    add esp, 4

    push menu_option4
    call print_string
    add esp, 4

    push menu_option5
    call print_string
    add esp, 4

    push menu_option6
    call print_string
    add esp, 4

    ret

section .data
    menu_option1 db '1. Add User', 10, 0
    menu_option2 db '2. Display Users', 10, 0
    menu_option3 db '3. Search Users', 10, 0
    menu_option4 db '4. Update User', 10, 0
    menu_option5 db '5. Delete User', 10, 0
    menu_option6 db '0. Exit', 10, 0

; Get user choice from input
get_user_choice:
    ; Read integer input
    push input_buffer
    push fmt_int
    call scanf
    add esp, 8

    ; Return value in eax
    mov eax, [input_buffer]
    ret

; Add new user
add_user:
    ; Get user input
    push name_prompt
    call print_string
    add esp, 4

    push input_buffer
    push fmt_str
    call scanf
    add esp, 8

    ; Copy name to temp buffer
    mov esi, input_buffer
    mov edi, temp_buffer
    call strcpy

    ; Get email
    push email_prompt
    call print_string
    add esp, 4

    push input_buffer
    push fmt_str
    call scanf
    add esp, 8

    ; Get role
    push role_prompt
    call print_string
    add esp, 4

    push input_buffer
    push fmt_int
    call scanf
    add esp, 8

    ; Check if we have space for more users
    mov eax, [user_count]
    cmp eax, MAX_USERS
    jge users_full

    ; Calculate user address
    mov eax, [user_count]
    imul eax, USER_SIZE
    add eax, users

    ; Store user data
    mov ebx, [next_id]
    mov [eax + USER_ID_OFFSET], ebx

    ; Copy name
    lea esi, [temp_buffer]
    lea edi, [eax + USER_NAME_OFFSET]
    call strcpy

    ; Copy email
    lea esi, [input_buffer]
    lea edi, [eax + USER_EMAIL_OFFSET]
    call strcpy

    ; Store role
    mov ebx, [input_buffer]
    mov [eax + USER_ROLE_OFFSET], ebx

    ; Set active status (default to 1)
    mov dword [eax + USER_ACTIVE_OFFSET], 1

    ; Set creation time (simplified)
    mov dword [eax + USER_CREATED_OFFSET], 1234567890

    ; Increment counters
    inc dword [user_count]
    inc dword [next_id]

    ; Show success message
    push user_added_msg
    call print_string
    add esp, 4

    ret

users_full:
    push users_full_msg
    call print_string
    add esp, 4
    ret

section .data
    name_prompt db 'Enter name: ', 0
    email_prompt db 'Enter email: ', 0
    role_prompt db 'Enter role (0=user, 1=moderator, 2=admin): ', 0
    users_full_msg db 'Error: Maximum users reached', 10, 0

; Display all users
display_users:
    ; Check if any users exist
    mov eax, [user_count]
    cmp eax, 0
    je no_users

    ; Print header
    push users_header
    call print_string
    add esp, 4

    ; Loop through users
    xor ecx, ecx        ; Counter
    mov esi, users      ; Users array

print_user_loop:
    cmp ecx, [user_count]
    jge print_done

    ; Print user info
    push dword [esi + USER_ACTIVE_OFFSET]
    push dword [esi + USER_ROLE_OFFSET]
    push esi + USER_EMAIL_OFFSET
    push esi + USER_NAME_OFFSET
    push dword [esi + USER_ID_OFFSET]
    push fmt_user
    call printf
    add esp, 24

    ; Next user
    add esi, USER_SIZE
    inc ecx
    jmp print_user_loop

print_done:
    ret

no_users:
    push no_users_msg
    call print_string
    add esp, 4
    ret

section .data
    users_header db '=== Users List ===', 10, 0
    no_users_msg db 'No users found.', 10, 0

; Search users by name
search_users:
    push search_prompt
    call print_string
    add esp, 4

    push input_buffer
    push fmt_str
    call scanf
    add esp, 8

    ; Search implementation (simplified)
    push search_results_msg
    call print_string
    add esp, 4

    ret

section .data
    search_prompt db 'Enter search term: ', 0
    search_results_msg db 'Search functionality not fully implemented in this demo.', 10, 0

; Update user
update_user:
    push update_prompt
    call print_string
    add esp, 4

    push input_buffer
    push fmt_int
    call scanf
    add esp, 8

    ; Find and update user (simplified)
    push update_msg
    call print_string
    add esp, 4

    ret

section .data
    update_prompt db 'Enter user ID to update: ', 0
    update_msg db 'Update functionality not fully implemented in this demo.', 10, 0

; Delete user
delete_user:
    push delete_prompt
    call print_string
    add esp, 4

    push input_buffer
    push fmt_int
    call scanf
    add esp, 8

    ; Find and delete user (simplified)
    push delete_msg
    call print_string
    add esp, 4

    ret

section .data
    delete_prompt db 'Enter user ID to delete: ', 0
    delete_msg db 'Delete functionality not fully implemented in this demo.', 10, 0

; Show statistics
show_stats:
    ; Calculate and display statistics
    mov eax, [user_count]
    push eax
    push stats_msg
    call printf
    add esp, 8

    ret

section .data
    stats_msg db 'Total users: %d', 10, 0

; Load database from file
load_database:
    ; File I/O implementation (simplified)
    push load_msg
    call print_string
    add esp, 4

    ret

section .data
    load_msg db 'Database loading not fully implemented in this demo.', 10, 0

; Save database to file
save_database:
    ; File I/O implementation (simplified)
    push save_msg
    call print_string
    add esp, 4

    ret

section .data
    save_msg db 'Database saving not fully implemented in this demo.', 10, 0

; Cleanup and exit
cleanup:
    call save_database
    ret

; String utility functions
strcpy:
    ; Copy string from ESI to EDI
    .loop:
        mov al, [esi]
        mov [edi], al
        inc esi
        inc edi
        test al, al
        jnz .loop
    ret

strlen:
    ; Get string length from ESI
    xor eax, eax
    .loop:
        cmp byte [esi + eax], 0
        je .done
        inc eax
        jmp .loop
    .done:
    ret

strcmp:
    ; Compare strings ESI and EDI
    .loop:
        mov al, [esi]
        mov bl, [edi]
        cmp al, bl
        jne .different
        test al, al
        jz .equal
        inc esi
        inc edi
        jmp .loop
    .different:
        mov eax, 1
        ret
    .equal:
        xor eax, eax
        ret

; Print string function
print_string:
    push ebp
    mov ebp, esp
    push eax
    push ebx
    push ecx
    push edx

    mov eax, 4          ; sys_write
    mov ebx, 1          ; stdout
    mov ecx, [ebp + 8]  ; string address
    call strlen
    mov edx, eax        ; string length
    int 0x80

    pop edx
    pop ecx
    pop ebx
    pop eax
    pop ebp
    ret

; Print integer function
print_int:
    push ebp
    mov ebp, esp
    push eax
    push ebx
    push ecx
    push edx

    ; Convert integer to string (simplified)
    mov eax, [ebp + 8]
    ; ... conversion logic ...

    pop edx
    pop ecx
    pop ebx
    pop eax
    pop ebp
    ret
