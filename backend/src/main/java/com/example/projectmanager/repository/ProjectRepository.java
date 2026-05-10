package com.example.projectmanager.repository;

import com.example.projectmanager.model.Project;
import com.example.projectmanager.model.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerOrMembersContaining(User owner, User member);
}

