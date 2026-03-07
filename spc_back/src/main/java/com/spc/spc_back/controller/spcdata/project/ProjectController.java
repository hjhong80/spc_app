package com.spc.spc_back.controller.spcdata.project;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.spc.spc_back.dto.ApiRespDto;
import com.spc.spc_back.dto.spcdata.ProjectAddReqDto;
import com.spc.spc_back.entity.spcdata.Project;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.service.spcdata.ProjectService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(value = "/spcdata/project", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;

    @GetMapping("/list")
    public ResponseEntity<ApiRespDto<List<Project>>> GetProjectList(
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(projectService.GetProjectList(principalUser));
    }

    @GetMapping("/{projId}")
    public ResponseEntity<ApiRespDto<Project>> GetProjectByProjId(
            @PathVariable Long projId,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(projectService.GetProjectByProjId(projId, principalUser));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiRespDto<List<Project>>> GetProjectByKeyword(
            @RequestParam String keyword,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(projectService.GetProjectByKeyword(keyword, principalUser));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiRespDto<Project>> PostAddProject(
            @Valid @RequestBody ProjectAddReqDto projectAddReqDto,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(projectService.PostAddProject(projectAddReqDto, principalUser));
    }

    @PostMapping("/modify/{projId}")
    public ResponseEntity<ApiRespDto<Project>> PostModifyProject(
            @PathVariable Long projId,
            @Valid @RequestBody ProjectAddReqDto projectAddReqDto,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(projectService.PostModifyProject(projId, projectAddReqDto, principalUser));
    }

    @PostMapping("/delete/{projId}")
    public ResponseEntity<ApiRespDto<Void>> PostDeleteProject(
            @PathVariable Long projId,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(projectService.PostDeleteProject(projId, principalUser));
    }
}
