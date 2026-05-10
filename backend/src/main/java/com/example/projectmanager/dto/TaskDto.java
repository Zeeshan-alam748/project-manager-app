package com.example.projectmanager.dto;

import com.example.projectmanager.model.Task;
import com.example.projectmanager.model.TaskStatus;
import java.time.LocalDate;

public record TaskDto(
        Long id,
        String title,
        String details,
        TaskStatus status,
        LocalDate dueDate,
        Long projectId,
        String projectName,
        UserDto assignee
) {
    public static TaskDto from(Task task) {
        UserDto assignee = task.getAssignee() == null ? null : UserDto.from(task.getAssignee());
        return new TaskDto(
                task.getId(),
                task.getTitle(),
                task.getDetails(),
                task.getStatus(),
                task.getDueDate(),
                task.getProject().getId(),
                task.getProject().getName(),
                assignee
        );
    }
}

