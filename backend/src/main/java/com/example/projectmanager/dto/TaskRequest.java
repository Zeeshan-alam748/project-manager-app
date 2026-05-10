package com.example.projectmanager.dto;

import com.example.projectmanager.model.TaskStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record TaskRequest(
        @NotBlank(message = "Task title is required") String title,
        @NotBlank(message = "Details are required") @Size(min = 5, message = "Details should be at least 5 characters") String details,
        @NotNull(message = "Status is required") TaskStatus status,
        @NotNull(message = "Due date is required") @FutureOrPresent(message = "Due date cannot be in the past") LocalDate dueDate,
        @NotNull(message = "Project is required") Long projectId,
        Long assigneeId
) {
}
