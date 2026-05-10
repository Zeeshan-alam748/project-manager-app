package com.example.projectmanager.controller;

import com.example.projectmanager.dto.UserDto;
import com.example.projectmanager.repository.UserRepository;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> users() {
        return userRepository.findAll().stream().map(UserDto::from).toList();
    }
}
