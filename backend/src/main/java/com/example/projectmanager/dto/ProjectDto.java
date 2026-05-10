package com.example.projectmanager.dto;

import com.example.projectmanager.model.Project;
import java.time.LocalDate;
import java.util.List;

public record ProjectDto(Long id, String name, String description, LocalDate dueDate, UserDto owner, List<UserDto> members) {
    public static ProjectDto from(Project project) {
        return new ProjectDto(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getDueDate(),
                UserDto.from(project.getOwner()),
                project.getMembers().stream().map(UserDto::from).toList()
        );
    }
}

