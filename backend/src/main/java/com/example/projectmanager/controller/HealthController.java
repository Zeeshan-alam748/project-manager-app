package com.example.projectmanager.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/")
    public String root() {
        return "Project Manager API is running! ✅";
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}