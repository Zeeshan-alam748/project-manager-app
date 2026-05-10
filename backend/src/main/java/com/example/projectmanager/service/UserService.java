package com.example.projectmanager.service;

import com.example.projectmanager.dto.UserDto;
import com.example.projectmanager.exception.ApiException;
import com.example.projectmanager.model.User;
import com.example.projectmanager.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User current(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User session was not found"));
    }

    public User byId(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public List<UserDto> allUsers() {
        return userRepository.findAll().stream().map(UserDto::from).toList();
    }
}
