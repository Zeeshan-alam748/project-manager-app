package com.example.projectmanager.dto;

import com.example.projectmanager.model.Role;

public record AuthResponse(String token, Long id, String name, String email, Role role) {
}

