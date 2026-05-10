package com.example.projectmanager.dto;

import com.example.projectmanager.model.Role;
import com.example.projectmanager.model.User;

public record UserDto(Long id, String name, String email, Role role) {
    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}

