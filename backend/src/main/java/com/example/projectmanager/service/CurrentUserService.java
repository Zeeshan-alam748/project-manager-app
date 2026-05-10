package com.example.projectmanager.service;

import com.example.projectmanager.exception.ApiException;
import com.example.projectmanager.model.Role;
import com.example.projectmanager.model.User;
import com.example.projectmanager.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User get() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Login required"));
    }

    public boolean isAdmin(User user) {
        return user.getRole() == Role.ADMIN;
    }
}
