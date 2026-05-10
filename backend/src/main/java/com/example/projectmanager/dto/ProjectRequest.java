package com.example.projectmanager.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Set;

public record ProjectRequest(
        @NotBlank(message = "Project name is required") String name,
        @NotBlank(message = "Description is required") @Size(min = 8, message = "Description should be at least 8 characters") String description,
        @NotNull(message = "Due date is required") @FutureOrPresent(message = "Due date cannot be in the past") LocalDate dueDate,
        Set<Long> memberIds
) {
}
